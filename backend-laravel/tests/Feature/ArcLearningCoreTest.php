<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\ExperienciaAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\Institucion;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\ObjetivoAprendizaje;
use App\Models\ProgresoExperiencia;
use App\Models\RutaAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Models\VersionCurso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArcLearningCoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_audience_and_difficulty_are_independent_and_invalid_audience_is_rejected(): void
    {
        $base = $this->baseAcademica('audiencia', 'TEENS');

        $respuesta = $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/cursos/{$base['curso']->id}/versiones",
            ['audiencia' => 'TEENS', 'etapa' => 'inicial', 'titulo' => 'Teens desde cero'],
        )->assertCreated();

        $respuesta->assertJsonPath('audiencia', 'TEENS')->assertJsonPath('etapa', 'inicial');
        $this->assertDatabaseHas('versiones_curso', ['audiencia' => 'TEENS', 'etapa' => 'inicial']);

        $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/cursos/{$base['curso']->id}/versiones",
            ['audiencia' => 'ADULTOS', 'etapa' => 'avanzada'],
        )->assertUnprocessable()->assertJsonValidationErrors('audiencia');
    }

    public function test_shared_path_targets_kids_and_teens_without_turning_audience_into_difficulty(): void
    {
        $base = $this->baseAcademica('shared', 'KIDS');
        $version = VersionCurso::create([
            'uuid' => (string) Str::uuid(),
            'id_curso' => $base['curso']->id,
            'numero' => 1,
            'audiencia' => 'TODOS',
            'etapa' => 'avanzada',
            'estado' => 'published',
            'publicado_at' => now(),
        ]);
        $ruta = RutaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $base['institucion']->id,
            'id_curso' => $base['curso']->id,
            'id_version_curso' => $version->id,
            'titulo' => 'Ruta compartida avanzada',
            'audiencia' => 'TODOS',
            'etapa' => 'avanzada',
            'estado' => 'published',
            'publicado_at' => now(),
        ]);
        $base['aula']->update(['id_version_curso' => $version->id]);
        $kids = $this->crearAlumno($base['institucion'], $base['aula'], 'kids-shared', 'KIDS');
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(), 'id_aula' => $base['aula']->id,
            'id_version_curso' => $version->id, 'id_ruta_aprendizaje' => $ruta->id,
            'id_usuario' => $kids->id, 'rol' => 'student', 'estado' => 'active',
        ]);

        $this->actingAs($kids)->getJson('/api/v1/alumno/rutas')
            ->assertOk()
            ->assertJsonPath('paths.0.audience', 'TODOS')
            ->assertJsonPath('paths.0.difficulty', 'avanzada');
    }

    public function test_course_version_publishing_is_immutable_and_an_offering_can_bind_the_published_version(): void
    {
        $base = $this->baseAcademica('version');
        $version = $this->crearVersion($base);
        $unidad = UnidadCurso::create([
            'id_curso' => $base['curso']->id,
            'id_version_curso' => $version->id,
            'uuid' => (string) Str::uuid(),
            'titulo' => 'Fundamentos',
            'orden' => 1,
            'estado' => 'draft',
        ]);
        Leccion::create([
            'id_unidad' => $unidad->id,
            'uuid' => (string) Str::uuid(),
            'titulo' => 'Variables',
            'orden' => 1,
            'estado' => 'draft',
        ]);

        $this->actingAs($base['admin'])->postJson("/api/v1/academico/versiones/{$version->id}/publicar")
            ->assertOk()->assertJsonPath('estado', 'published');
        $this->actingAs($base['admin'])->putJson("/api/v1/academico/versiones/{$version->id}", [
            'titulo' => 'Mutación histórica',
            'audiencia' => 'TEENS',
            'etapa' => 'inicial',
        ])->assertStatus(409);
        $this->actingAs($base['admin'])->putJson("/api/v1/academico/unidades/{$unidad->id}", [
            'titulo' => 'Mutación', 'orden' => 1,
        ])->assertStatus(409);
        $this->actingAs($base['admin'])->putJson("/api/v1/academico/aulas/{$base['aula']->id}/version", [
            'id_version_curso' => $version->id,
        ])->assertOk()->assertJsonPath('id_version_curso', $version->id);
    }

    public function test_new_enrollment_freezes_the_offering_version_while_legacy_offering_remains_valid(): void
    {
        $base = $this->escenarioPublicado('freeze');
        $nuevo = $this->crearAlumno($base['institucion'], null, 'nuevo-freeze');

        $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/aulas/{$base['aula']->id}/usuarios/{$nuevo->id}",
            ['rol' => 'student', 'es_principal' => true, 'estado' => 'active'],
        )->assertCreated()->assertJsonPath('id_version_curso', $base['version']->id);

        $aulaLegacy = Aula::create([
            'id_institucion' => $base['institucion']->id,
            'id_curso' => $base['curso']->id,
            'nombre' => 'Aula legacy',
            'nivel' => 'KIDS',
        ]);
        $legacy = $this->crearAlumno($base['institucion'], $aulaLegacy, 'legacy-kids', 'KIDS');
        $this->actingAs($legacy)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('courseVersion', null)
            ->assertJsonPath('path', null)
            ->assertJsonPath('legacyFallback', false);
    }

    public function test_path_prerequisite_cycles_are_rejected_and_rolled_back(): void
    {
        $base = $this->escenarioPublicado('cycle', false);
        $ruta = $this->crearRuta($base, 'draft');
        $a = $this->crearHito($ruta, 'A', 1);
        $b = $this->crearHito($ruta, 'B', 2);

        $this->actingAs($base['admin'])->putJson("/api/v1/academico/hitos/{$a->id}/prerrequisitos", [
            'prerrequisitos' => [$b->id],
        ])->assertOk();
        $this->actingAs($base['admin'])->putJson("/api/v1/academico/hitos/{$b->id}/prerrequisitos", [
            'prerrequisitos' => [$a->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('prerrequisitos');

        $this->assertDatabaseMissing('hito_prerrequisitos', ['id_hito' => $b->id, 'id_prerrequisito' => $a->id]);
    }

    public function test_author_can_configure_publish_and_archive_a_structurally_valid_path(): void
    {
        $base = $this->escenarioPublicado('authoring', false);
        $rutaId = $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/versiones/{$base['version']->id}/rutas",
            ['titulo' => 'Ruta de autoría', 'audiencia' => 'TEENS', 'etapa' => 'inicial'],
        )->assertCreated()->json('id');
        $hitoId = $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/rutas/{$rutaId}/hitos",
            ['titulo' => 'Fundamentos', 'orden' => 1, 'obligatorio' => true],
        )->assertCreated()->json('id');
        $this->actingAs($base['admin'])->postJson(
            "/api/v1/academico/hitos/{$hitoId}/experiencias",
            [
                'id_unidad' => $base['unidad']->id,
                'tipo' => 'leccion',
                'titulo' => 'Lección configurada',
                'origen_tipo' => 'leccion',
                'origen_id' => $base['leccion']->id,
                'orden' => 1,
                'obligatoria' => true,
                'regla_completitud' => ['modo' => 'lesson_completion'],
            ],
        )->assertCreated();
        $this->actingAs($base['admin'])->postJson("/api/v1/academico/rutas/{$rutaId}/publicar")
            ->assertOk()->assertJsonPath('estado', 'published');
        $this->actingAs($base['admin'])->postJson("/api/v1/academico/rutas/{$rutaId}/archivar")
            ->assertOk()->assertJsonPath('estado', 'archived');
        $this->actingAs($base['admin'])->putJson("/api/v1/academico/rutas/{$rutaId}", [
            'titulo' => 'Reescritura histórica', 'audiencia' => 'TEENS', 'etapa' => 'inicial',
        ])->assertStatus(409);
    }

    public function test_learning_map_orders_unlocks_and_advances_required_experiences(): void
    {
        $escenario = $this->escenarioConRuta('mapa');

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('path.audience', 'TEENS')
            ->assertJsonPath('path.difficulty', 'inicial')
            ->assertJsonPath('milestones.0.state', 'unlocked')
            ->assertJsonPath('milestones.0.experiences.0.state', 'current')
            ->assertJsonPath('milestones.1.state', 'locked')
            ->assertJsonPath('nextItem.id', $escenario['leccionExperiencia']->id);
        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextAction.type', 'lesson')
            ->assertJsonPath('nextLearningItem.id', $escenario['leccionExperiencia']->id);

        $this->actingAs($escenario['alumno'])->putJson(
            "/api/v1/alumno/aprendizaje/lecciones/{$escenario['leccion']->id}/progreso",
            ['estado' => 'completed', 'porcentaje' => 100],
        )->assertOk();

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('milestones.0.state', 'completed')
            ->assertJsonPath('milestones.1.state', 'unlocked')
            ->assertJsonPath('milestones.1.experiences.0.state', 'current')
            ->assertJsonPath('nextItem.id', $escenario['evaluacionExperiencia']->id);
    }

    public function test_optional_experience_does_not_block_milestone_or_path_completion(): void
    {
        $escenario = $this->escenarioConRuta('optional', false);
        $opcionalId = DB::table('experiencias_aprendizaje')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'id_hito' => $escenario['hitoUno']->id,
            'tipo' => 'proyecto',
            'titulo' => 'Proyecto opcional',
            'orden' => 2,
            'obligatoria' => false,
            'permite_intentos' => true,
            'estado' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $opcional = ExperienciaAprendizaje::findOrFail($opcionalId);
        ProgresoExperiencia::create([
            'id_matricula' => $escenario['matricula']->id,
            'id_alumno' => $escenario['alumno']->id,
            'id_experiencia' => $escenario['leccionExperiencia']->id,
            'estado' => 'completed',
            'porcentaje' => 100,
            'completado_at' => now(),
        ]);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('milestones.0.state', 'completed')
            ->assertJsonPath('milestones.0.experiences.1.id', $opcional->id)
            ->assertJsonPath('progress.percent', 100);
    }

    public function test_progress_is_scoped_to_enrollment_and_does_not_contaminate_a_new_cohort(): void
    {
        $escenario = $this->escenarioConRuta('scope', false);
        ProgresoExperiencia::create([
            'id_matricula' => $escenario['matricula']->id,
            'id_alumno' => $escenario['alumno']->id,
            'id_experiencia' => $escenario['leccionExperiencia']->id,
            'estado' => 'completed',
            'porcentaje' => 100,
        ]);
        $escenario['matricula']->update(['es_principal' => false]);
        $segundaAula = Aula::create([
            'id_institucion' => $escenario['institucion']->id,
            'id_curso' => $escenario['curso']->id,
            'id_version_curso' => $escenario['version']->id,
            'nombre' => 'Segunda cohorte',
            'nivel' => 'TEENS',
        ]);
        $segunda = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $segundaAula->id,
            'id_version_curso' => $escenario['version']->id,
            'id_ruta_aprendizaje' => $escenario['ruta']->id,
            'id_usuario' => $escenario['alumno']->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('enrollment.id', $segunda->id)
            ->assertJsonPath('progress.completedRequiredExperienceCount', 0)
            ->assertJsonPath('nextItem.id', $escenario['leccionExperiencia']->id);
    }

    public function test_attempt_submission_feedback_completion_and_events_are_idempotent(): void
    {
        $escenario = $this->escenarioConRuta('events', false, true);
        $experiencia = $escenario['leccionExperiencia'];
        $objetivo = ObjetivoAprendizaje::create([
            'id_institucion' => $escenario['institucion']->id,
            'uuid' => (string) Str::uuid(),
            'codigo' => 'LOG-01',
            'descripcion' => 'Construye una condición lógica.',
            'nivel' => 'TEENS',
        ]);
        $experiencia->objetivos()->sync([$objetivo->id]);
        $clave = 'attempt-events-001';

        $primero = $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/experiencias/{$experiencia->id}/intentos",
            ['idempotency_key' => $clave],
        )->assertCreated();
        $intentoId = $primero->json('id');
        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/experiencias/{$experiencia->id}/intentos",
            ['idempotency_key' => $clave],
        )->assertCreated()->assertJsonPath('id', $intentoId);
        $this->assertDatabaseCount('intentos_aprendizaje', 1);

        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            ['tipo' => 'assessment_result', 'id_objetivo' => $objetivo->id, 'metadatos' => ['answerCount' => 3]],
        )->assertOk()->assertJsonPath('estado', 'submitted');
        $evaluacion = ['aprobado' => true, 'puntaje' => 90, 'comentario' => 'Buen razonamiento.'];
        $this->actingAs($escenario['admin'])->postJson("/api/v1/academico/intentos/{$intentoId}/evaluar", $evaluacion)
            ->assertOk()->assertJsonPath('aprobado', true);
        $this->actingAs($escenario['admin'])->postJson("/api/v1/academico/intentos/{$intentoId}/evaluar", $evaluacion)
            ->assertOk();

        $this->assertDatabaseHas('progresos_experiencia', [
            'id_matricula' => $escenario['matricula']->id,
            'id_experiencia' => $experiencia->id,
            'estado' => 'completed',
        ]);
        $this->assertSame(1, DB::table('eventos_dominio')->where('tipo', 'learning.assessment.passed')->count());
        $this->assertSame(1, DB::table('eventos_dominio')->where('tipo', 'learning.experience.completed')->count());
        $this->assertSame(1, DB::table('eventos_dominio')->where('tipo', 'learning.course.completed')->count());
        $this->assertDatabaseHas('feedback_aprendizaje', ['id_intento' => $intentoId, 'comentario' => 'Buen razonamiento.']);
        $this->assertDatabaseHas('evidencias_aprendizaje', ['id_intento' => $intentoId, 'id_objetivo' => $objetivo->id]);
        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()->assertJsonPath('path.state', 'completed')->assertJsonPath('nextItem', null);
    }

    public function test_attempt_limit_and_evidence_taxonomy_are_enforced_by_the_domain_contract(): void
    {
        $escenario = $this->escenarioConRuta('retry', false, true);
        $experiencia = $escenario['leccionExperiencia'];
        DB::table('experiencias_aprendizaje')->where('id', $experiencia->id)->update(['max_intentos' => 1]);
        $experiencia->refresh();
        $intentoId = $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/experiencias/{$experiencia->id}/intentos",
            ['idempotency_key' => 'retry-001'],
        )->assertCreated()->json('id');
        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            ['tipo' => 'page_view'],
        )->assertUnprocessable()->assertJsonValidationErrors('tipo');
        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            ['tipo' => 'assessment_result'],
        )->assertOk();
        $this->actingAs($escenario['admin'])->postJson("/api/v1/academico/intentos/{$intentoId}/evaluar", [
            'aprobado' => false, 'puntaje' => 40,
        ])->assertOk();
        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/experiencias/{$experiencia->id}/intentos",
            ['idempotency_key' => 'retry-002'],
        )->assertUnprocessable();
    }

    public function test_locked_experience_cannot_be_attempted_and_student_cannot_author_evaluate_or_forge_events(): void
    {
        $escenario = $this->escenarioConRuta('security');

        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/alumno/aprender/experiencias/{$escenario['evaluacionExperiencia']->id}/intentos",
            ['idempotency_key' => 'locked-001'],
        )->assertForbidden();
        $this->actingAs($escenario['alumno'])->postJson(
            "/api/v1/academico/cursos/{$escenario['curso']->id}/versiones",
            ['audiencia' => 'TEENS', 'etapa' => 'inicial'],
        )->assertForbidden();
        $this->actingAs($escenario['alumno'])->postJson('/api/v1/alumno/aprender/eventos', [
            'type' => 'learning.course.completed',
        ])->assertNotFound();
        $this->assertDatabaseCount('eventos_dominio', 0);
    }

    public function test_student_without_enrollment_gets_honest_empty_learning_core_states(): void
    {
        $base = $this->baseAcademica('empty');
        $alumno = $this->crearAlumno($base['institucion'], null, 'empty-student');

        $this->actingAs($alumno)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('enrollment', null)
            ->assertJsonPath('path', null)
            ->assertJsonPath('nextItem', null)
            ->assertJsonCount(0, 'milestones');
        $this->actingAs($alumno)->getJson('/api/v1/alumno/rutas')
            ->assertOk()->assertJsonCount(0, 'paths');
    }

    private function escenarioConRuta(
        string $sufijo,
        bool $dosHitos = true,
        bool $primeraEsEvaluacion = false,
    ): array {
        $base = $this->escenarioPublicado($sufijo, false);
        $ruta = $this->crearRuta($base, 'draft');
        $hitoUno = $this->crearHito($ruta, 'Fundamentos', 1);
        $hitoDos = $dosHitos ? $this->crearHito($ruta, 'Aplicación', 2) : null;
        if ($hitoDos) {
            $hitoDos->prerrequisitos()->sync([$hitoUno->id]);
        }
        $leccionExperiencia = ExperienciaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_hito' => $hitoUno->id,
            'id_unidad' => $base['unidad']->id,
            'tipo' => $primeraEsEvaluacion ? 'evaluacion' : 'leccion',
            'titulo' => $primeraEsEvaluacion ? 'Evaluación inicial' : 'Lección inicial',
            'origen_tipo' => $primeraEsEvaluacion ? null : 'leccion',
            'origen_id' => $primeraEsEvaluacion ? null : $base['leccion']->id,
            'orden' => 1,
            'obligatoria' => true,
            'permite_intentos' => $primeraEsEvaluacion,
            'max_intentos' => $primeraEsEvaluacion ? 3 : null,
            'regla_completitud' => $primeraEsEvaluacion ? ['modo' => 'passing_score', 'puntaje_minimo' => 70] : ['modo' => 'lesson_completion'],
            'estado' => 'published',
        ]);
        $evaluacionExperiencia = $hitoDos ? ExperienciaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_hito' => $hitoDos->id,
            'tipo' => 'evaluacion',
            'titulo' => 'Evaluación de aplicación',
            'orden' => 1,
            'obligatoria' => true,
            'permite_intentos' => true,
            'max_intentos' => 3,
            'regla_completitud' => ['modo' => 'passing_score', 'puntaje_minimo' => 70],
            'estado' => 'published',
        ]) : null;
        $ruta->update(['estado' => 'published', 'publicado_at' => now()]);
        $base['matricula']->update(['id_ruta_aprendizaje' => $ruta->id]);

        return [...$base, 'ruta' => $ruta, 'hitoUno' => $hitoUno, 'hitoDos' => $hitoDos,
            'leccionExperiencia' => $leccionExperiencia, 'evaluacionExperiencia' => $evaluacionExperiencia];
    }

    private function escenarioPublicado(string $sufijo, bool $conRuta = false): array
    {
        $base = $this->baseAcademica($sufijo);
        $version = $this->crearVersion($base, 'draft');
        $unidad = UnidadCurso::create([
            'id_curso' => $base['curso']->id,
            'id_version_curso' => $version->id,
            'uuid' => (string) Str::uuid(),
            'titulo' => 'Unidad '.$sufijo,
            'orden' => 1,
            'estado' => 'published',
        ]);
        $leccion = Leccion::create([
            'id_unidad' => $unidad->id,
            'uuid' => (string) Str::uuid(),
            'titulo' => 'Lección '.$sufijo,
            'orden' => 1,
            'estado' => 'published',
        ]);
        $version->update(['estado' => 'published', 'publicado_at' => now()]);
        $base['aula']->update(['id_version_curso' => $version->id]);
        $alumno = $this->crearAlumno($base['institucion'], $base['aula'], 'alumno-'.$sufijo);
        $matricula = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $base['aula']->id,
            'id_version_curso' => $version->id,
            'id_usuario' => $alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);

        return [...$base, 'version' => $version, 'unidad' => $unidad, 'leccion' => $leccion, 'alumno' => $alumno, 'matricula' => $matricula];
    }

    private function baseAcademica(string $sufijo, string $nivel = 'TEENS'): array
    {
        $institucion = Institucion::create(['nombre' => 'Institución '.$sufijo, 'slug' => 'inst-'.$sufijo]);
        $admin = $this->crearUsuario($institucion, null, 'admin-'.$sufijo, 'admin', $nivel);
        $curso = Curso::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'Programación '.$sufijo,
            'codigo' => 'ARC-'.Str::upper($sufijo),
            'nivel' => $nivel,
            'estado' => 'published',
            'publicado_at' => now(),
        ]);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'id_curso' => $curso->id,
            'nombre' => 'Cohorte '.$sufijo,
            'nivel' => $nivel,
        ]);

        return compact('institucion', 'admin', 'curso', 'aula');
    }

    private function crearVersion(array $base, string $estado = 'draft'): VersionCurso
    {
        return VersionCurso::create([
            'uuid' => (string) Str::uuid(),
            'id_curso' => $base['curso']->id,
            'numero' => 1,
            'audiencia' => $base['curso']->nivel,
            'etapa' => 'inicial',
            'estado' => $estado,
            'publicado_at' => $estado === 'published' ? now() : null,
        ]);
    }

    private function crearRuta(array $base, string $estado): RutaAprendizaje
    {
        return RutaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $base['institucion']->id,
            'id_curso' => $base['curso']->id,
            'id_version_curso' => $base['version']->id,
            'titulo' => 'Ruta '.$base['curso']->titulo,
            'audiencia' => $base['curso']->nivel,
            'etapa' => 'inicial',
            'estado' => $estado,
            'publicado_at' => $estado === 'published' ? now() : null,
        ]);
    }

    private function crearHito(RutaAprendizaje $ruta, string $titulo, int $orden): HitoAprendizaje
    {
        return HitoAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_ruta' => $ruta->id,
            'titulo' => $titulo,
            'orden' => $orden,
            'obligatorio' => true,
        ]);
    }

    private function crearAlumno(Institucion $institucion, ?Aula $aula, string $sufijo, string $nivel = 'TEENS'): Usuario
    {
        return $this->crearUsuario($institucion, $aula, $sufijo, 'alumno', $nivel);
    }

    private function crearUsuario(
        Institucion $institucion,
        ?Aula $aula,
        string $sufijo,
        string $rol,
        string $nivel,
    ): Usuario {
        return Usuario::create([
            'nombre_completo' => Str::title(str_replace('-', ' ', $sufijo)),
            'usuario' => $sufijo,
            'email' => $sufijo.'@example.test',
            'password_hash' => bcrypt('secret-123'),
            'rol' => $rol,
            'nivel' => $nivel,
            'id_institucion' => $institucion->id,
            'id_aula' => $aula?->id,
        ]);
    }
}
