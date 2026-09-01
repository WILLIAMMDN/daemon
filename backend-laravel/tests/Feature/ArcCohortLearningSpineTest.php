<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Institucion;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\PeriodoAcademico;
use App\Models\ProgresoLeccion;
use App\Models\SesionAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArcCohortLearningSpineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-31 15:00:00 UTC');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_authenticated_student_receives_own_active_enrollment_course_cohort_and_real_progress(): void
    {
        $escenario = $this->escenarioAcademico('activo');
        $primera = $this->crearLeccion($escenario['curso'], 'Introducción', 1);
        $segunda = $this->crearLeccion($escenario['curso'], 'Condicionales', 2);
        ProgresoLeccion::create([
            'id_leccion' => $primera->id,
            'id_alumno' => $escenario['alumno']->id,
            'estado' => 'completed',
            'porcentaje' => 100,
        ]);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/learning-context')
            ->assertOk()
            ->assertJsonPath('student.id', $escenario['alumno']->id)
            ->assertJsonPath('currentEnrollment.id', $escenario['matricula']->id)
            ->assertJsonPath('currentEnrollment.course.id', $escenario['curso']->id)
            ->assertJsonPath('currentEnrollment.cohort.id', $escenario['aula']->id)
            ->assertJsonPath('currentEnrollment.progress.lessonCount', 2)
            ->assertJsonPath('currentEnrollment.progress.completedLessonCount', 1)
            ->assertJsonPath('currentEnrollment.progress.lessonProgressPercent', 50)
            ->assertJsonCount(1, 'activeEnrollments');

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextAction.type', 'lesson')
            ->assertJsonPath('nextAction.lesson.id', $segunda->id)
            ->assertJsonMissingPath('student.email')
            ->assertJsonMissingPath('currentEnrollment.cohort.students');
    }

    public function test_student_without_active_enrollment_receives_meaningful_empty_state(): void
    {
        $escenario = $this->escenarioAcademico('retirado');
        $escenario['matricula']->update(['fecha_fin' => '2026-08-01']);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('currentEnrollment', null)
            ->assertJsonPath('currentCourse', null)
            ->assertJsonPath('cohort', null)
            ->assertJsonPath('nextLiveSession', null)
            ->assertJsonPath('nextAction', null)
            ->assertJsonPath('upcomingAgendaSummary.total', 0);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/learning-context')
            ->assertOk()
            ->assertJsonPath('currentEnrollment', null)
            ->assertJsonCount(0, 'activeEnrollments');
    }

    public function test_next_live_is_the_first_future_scheduled_session_for_an_active_enrollment(): void
    {
        $escenario = $this->escenarioAcademico('live');
        $this->crearSesion($escenario['aula'], 'Sesión pasada', '2026-08-31 14:00:00');
        $this->crearSesion($escenario['aula'], 'Cancelada', '2026-08-31 16:00:00', 'cancelled');
        $esperada = $this->crearSesion($escenario['aula'], 'Variables en vivo', '2026-08-31 17:00:00');
        $this->crearSesion($escenario['aula'], 'Sesión posterior', '2026-09-01 17:00:00');

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession.id', $esperada->id)
            ->assertJsonPath('nextLiveSession.title', 'Variables en vivo')
            ->assertJsonPath('nextLiveSession.startsAt', '2026-08-31T17:00:00Z')
            ->assertJsonPath('nextLiveSession.access.joinUrl', 'https://meet.example.test/variables');
    }

    public function test_no_upcoming_live_returns_null_instead_of_a_placeholder(): void
    {
        $escenario = $this->escenarioAcademico('sin-live');
        $this->crearSesion($escenario['aula'], 'Ya terminó', '2026-08-30 15:00:00', 'completed');

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession', null)
            ->assertJsonPath('upcomingAgendaSummary.total', 0);
    }

    public function test_agenda_filters_with_an_exclusive_end_and_rejects_unbounded_ranges(): void
    {
        $escenario = $this->escenarioAcademico('agenda');
        $this->crearSesion($escenario['aula'], 'Antes', '2026-09-01 09:00:00');
        $incluida = $this->crearSesion($escenario['aula'], 'Dentro', '2026-09-02 09:00:00');
        $this->crearSesion($escenario['aula'], 'En el límite', '2026-09-03 00:00:00');

        $this->actingAs($escenario['alumno'])->getJson(
            '/api/v1/alumno/agenda?start=2026-09-02T00%3A00%3A00Z&end=2026-09-03T00%3A00%3A00Z',
        )->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.id', $incluida->id)
            ->assertJsonPath('events.0.type', 'live_session');

        $this->actingAs($escenario['alumno'])->getJson(
            '/api/v1/alumno/agenda?start=2026-01-01T00%3A00%3A00Z&end=2026-12-31T00%3A00%3A00Z',
        )->assertUnprocessable()->assertJsonValidationErrors('end');
    }

    public function test_client_supplied_student_id_cannot_change_the_authenticated_context(): void
    {
        $propio = $this->escenarioAcademico('propio');
        $otro = $this->escenarioAcademico('otro');

        $this->actingAs($propio['alumno'])->getJson(
            '/api/v1/alumno/home-context?student_id='.$otro['alumno']->id,
        )->assertOk()
            ->assertJsonPath('student.id', $propio['alumno']->id)
            ->assertJsonPath('currentEnrollment.cohort.id', $propio['aula']->id)
            ->assertJsonMissing(['id' => $otro['aula']->id, 'name' => $otro['aula']->nombre]);
    }

    public function test_legacy_student_aula_without_enrollment_course_or_period_does_not_crash(): void
    {
        $institucion = $this->crearInstitucion('legacy');
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula Legacy',
            'nivel' => 'TEENS',
        ]);
        $alumno = $this->crearAlumno($institucion, $aula, 'legacy');

        $this->actingAs($alumno)->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('currentEnrollment.id', null)
            ->assertJsonPath('currentEnrollment.cohort.id', $aula->id)
            ->assertJsonPath('currentCourse', null)
            ->assertJsonPath('nextLiveSession', null);

        $this->actingAs($alumno)->getJson('/api/v1/alumno/agenda')
            ->assertOk()
            ->assertJsonCount(0, 'events');
    }

    public function test_academic_staff_can_store_a_real_session_but_other_institutions_are_forbidden(): void
    {
        $escenario = $this->escenarioAcademico('gestion');
        $admin = $this->crearUsuario($escenario['institucion'], 'admin', 'admin-gestion');
        $otro = $this->escenarioAcademico('gestion-otra');
        $docenteOtro = $this->crearUsuario($otro['institucion'], 'docente', 'docente-otro');
        $datos = [
            'titulo' => 'Laboratorio LIVE',
            'inicio_at' => '2026-09-05T15:00:00-05:00',
            'fin_at' => '2026-09-05T16:30:00-05:00',
            'acceso_url' => 'https://meet.example.test/laboratorio',
        ];

        $this->actingAs($admin)->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", $datos)
            ->assertCreated()
            ->assertJsonPath('estado', 'scheduled')
            ->assertJsonPath('id_creador', $admin->id);

        $this->actingAs($escenario['alumno'])->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession.startsAt', '2026-09-05T20:00:00Z');

        $this->actingAs($docenteOtro)->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", $datos)
            ->assertForbidden();
    }

    private function escenarioAcademico(string $sufijo): array
    {
        $institucion = $this->crearInstitucion($sufijo);
        $periodo = PeriodoAcademico::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'Cohorte 2026',
            'tipo' => 'term',
            'fecha_inicio' => '2026-08-01',
            'fecha_fin' => '2026-12-20',
            'estado' => 'active',
        ]);
        $curso = Curso::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'Programación '.$sufijo,
            'codigo' => 'ARC-'.Str::upper(Str::random(6)),
            'nivel' => 'TEENS',
            'estado' => 'published',
            'publicado_at' => now(),
        ]);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'id_curso' => $curso->id,
            'id_periodo_academico' => $periodo->id,
            'nombre' => 'Cohorte '.$sufijo,
            'codigo' => 'COH-'.Str::upper(Str::random(6)),
            'nivel' => 'TEENS',
        ]);
        $alumno = $this->crearAlumno($institucion, $aula, $sufijo);
        $matricula = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $aula->id,
            'id_usuario' => $alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'fecha_inicio' => '2026-08-01',
            'estado' => 'active',
        ]);

        return compact('institucion', 'periodo', 'curso', 'aula', 'alumno', 'matricula');
    }

    private function crearInstitucion(string $sufijo): Institucion
    {
        return Institucion::create([
            'nombre' => 'Institución '.$sufijo,
            'slug' => 'institucion-'.$sufijo.'-'.Str::lower(Str::random(6)),
        ]);
    }

    private function crearAlumno(Institucion $institucion, ?Aula $aula, string $sufijo): Usuario
    {
        return $this->crearUsuario($institucion, 'alumno', 'alumno-'.$sufijo, $aula);
    }

    private function crearUsuario(
        Institucion $institucion,
        string $rol,
        string $sufijo,
        ?Aula $aula = null,
    ): Usuario {
        return Usuario::create([
            'nombre_completo' => Str::title(str_replace('-', ' ', $sufijo)),
            'usuario' => $sufijo.'.'.Str::lower(Str::random(6)),
            'email' => $sufijo.'.'.Str::lower(Str::random(5)).'@example.test',
            'password_hash' => bcrypt('secret-123'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
            'id_aula' => $aula?->id,
        ]);
    }

    private function crearLeccion(Curso $curso, string $titulo, int $orden): Leccion
    {
        $unidad = UnidadCurso::firstOrCreate(
            ['id_curso' => $curso->id, 'orden' => 1],
            ['uuid' => (string) Str::uuid(), 'titulo' => 'Fundamentos', 'estado' => 'published'],
        );

        return Leccion::create([
            'id_unidad' => $unidad->id,
            'uuid' => (string) Str::uuid(),
            'titulo' => $titulo,
            'orden' => $orden,
            'duracion_minutos' => 20,
            'estado' => 'published',
        ]);
    }

    private function crearSesion(
        Aula $aula,
        string $titulo,
        string $inicio,
        string $estado = 'scheduled',
    ): SesionAprendizaje {
        return SesionAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_aula' => $aula->id,
            'titulo' => $titulo,
            'inicio_at' => $inicio,
            'fin_at' => CarbonImmutable::parse($inicio)->addHour(),
            'tipo' => 'live',
            'estado' => $estado,
            'acceso_url' => 'https://meet.example.test/variables',
        ]);
    }
}
