<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Evaluacion;
use App\Models\Institucion;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\Mision;
use App\Models\ObjetivoAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Services\Academico\LibroCalificacionesService;
use App\Services\Interoperabilidad\OneRosterAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AcademicMasteryGradebookTest extends TestCase
{
    use RefreshDatabase;

    public function test_curriculo_rechaza_objetivos_y_traslados_entre_instituciones(): void
    {
        $escenario = $this->escenario();

        $this->actingAs($escenario['admin'])->postJson("/api/v1/academico/unidades/{$escenario['unidad_a']->id}/lecciones", [
            'titulo' => 'Lección insegura',
            'orden' => 2,
            'estado' => 'published',
            'objetivos' => [$escenario['objetivo_b']->id],
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Todos los objetivos deben pertenecer a la institución del curso.');

        $this->actingAs($escenario['admin'])->putJson("/api/v1/academico/cursos/{$escenario['curso_a']->id}", [
            'id_institucion' => $escenario['institucion_b']->id,
            'titulo' => $escenario['curso_a']->titulo,
            'codigo' => $escenario['curso_a']->codigo,
            'nivel' => 'TEENS',
            'estado' => 'published',
        ])->assertUnprocessable();

        $this->assertDatabaseHas('cursos', [
            'id' => $escenario['curso_a']->id,
            'id_institucion' => $escenario['institucion_a']->id,
        ]);
    }

    public function test_mision_calificada_alimenta_libro_y_dominio_sin_filtrar_otra_institucion(): void
    {
        $escenario = $this->escenario();

        $misionId = $this->actingAs($escenario['docente_a'])->postJson('/api/v1/misiones', [
            'titulo' => 'Explica una secuencia',
            'descripcion' => 'Entrega una explicación breve.',
            'recompensa' => 20,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
            'id_leccion' => $escenario['leccion_a']->id,
            'objetivos' => [$escenario['objetivo_a']->id],
        ])->assertCreated()
            ->assertJsonPath('id_institucion', $escenario['institucion_a']->id)
            ->assertJsonPath('id_aula', $escenario['aula_a']->id)
            ->json('id');

        $misionAmbigua = Mision::create([
            'titulo' => 'Legacy sin institución',
            'recompensa' => 1,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
        ]);

        $this->actingAs($escenario['alumno_b'])->getJson('/api/v1/misiones')
            ->assertOk()
            ->assertJsonMissing(['id' => $misionId])
            ->assertJsonMissing(['id' => $misionAmbigua->id]);
        $this->actingAs($escenario['alumno_a'])->getJson('/api/v1/misiones')
            ->assertOk()
            ->assertJsonMissing(['id' => $misionAmbigua->id]);

        $entregaId = $this->actingAs($escenario['alumno_a'])->postJson("/api/v1/misiones/{$misionId}/entregar", [
            'texto' => 'Primero observo, después ordeno y al final pruebo.',
        ])->assertCreated()->json('id');

        $this->actingAs($escenario['docente_a'])->postJson("/api/v1/misiones/entregas/{$entregaId}/revisar", [
            'estado' => 'aprobado',
            'calificacion' => 20,
            'puntaje_academico' => 86,
            'comentario_docente' => 'Secuencia correcta y clara.',
        ])->assertOk()->assertJsonPath('puntaje_academico', 86);

        $this->assertDatabaseHas('items_calificacion', ['origen_tipo' => 'mision', 'origen_id' => $misionId]);
        $this->assertDatabaseHas('resultados_calificacion', [
            'id_alumno' => $escenario['alumno_a']->id,
            'porcentaje' => 86,
        ]);
        $this->assertDatabaseHas('dominios_objetivo', [
            'id_alumno' => $escenario['alumno_a']->id,
            'id_objetivo' => $escenario['objetivo_a']->id,
            'nivel_dominio' => 'competente',
        ]);

        $this->actingAs($escenario['alumno_a'])->getJson('/api/v1/alumno/dominio')
            ->assertOk()
            ->assertJsonPath('resumen.con_evidencia', 1)
            ->assertJsonPath('objetivos.0.porcentaje', '86.00');

        $this->actingAs($escenario['docente_a'])->getJson('/api/v1/academico/libro-calificaciones')
            ->assertOk()
            ->assertJsonPath('resumen.items', 1)
            ->assertJsonPath('resumen.resultados', 1);
    }

    public function test_publicacion_y_resultados_de_evaluacion_quedan_aislados_por_aula(): void
    {
        $escenario = $this->escenario();
        $evaluacionA = $this->crearEvaluacion($escenario['docente_a'], $escenario['leccion_a'], $escenario['objetivo_a']);
        $evaluacionB = $this->crearEvaluacion($escenario['docente_b'], $escenario['leccion_b'], $escenario['objetivo_b']);

        $this->actingAs($escenario['docente_b'])->postJson("/api/v1/evaluaciones/{$evaluacionB}/publicar")->assertOk();
        $this->actingAs($escenario['docente_a'])->postJson("/api/v1/evaluaciones/{$evaluacionA}/publicar")->assertOk();

        $this->assertSame('activo', Evaluacion::findOrFail($evaluacionA)->estado);
        $this->assertSame('activo', Evaluacion::findOrFail($evaluacionB)->estado);

        $preguntaId = Evaluacion::findOrFail($evaluacionA)->preguntas()->value('id');
        $this->actingAs($escenario['alumno_a'])->postJson("/api/v1/evaluaciones/{$evaluacionA}/responder", [
            'respuestas' => [(string) $preguntaId => 'Primero'],
        ])->assertOk()->assertJsonPath('resultado.puntaje', 100);

        $this->assertDatabaseHas('resultados_calificacion', [
            'id_alumno' => $escenario['alumno_a']->id,
            'porcentaje' => 100,
        ]);
        $this->assertDatabaseHas('dominios_objetivo', [
            'id_alumno' => $escenario['alumno_a']->id,
            'id_objetivo' => $escenario['objetivo_a']->id,
            'nivel_dominio' => 'dominado',
        ]);

        $this->actingAs($escenario['alumno_a'])->postJson("/api/v1/evaluaciones/{$evaluacionA}/responder", [
            'respuestas' => [(string) $preguntaId => 'Respuesta incorrecta'],
        ])->assertOk()->assertJsonPath('resultado.puntaje', 0);

        $this->assertDatabaseCount('respuestas_examen', 1);
        $this->assertDatabaseCount('resultados_calificacion', 1);
        $this->assertSame(100, $escenario['alumno_a']->fresh()->experiencia);
        $this->assertDatabaseHas('dominios_objetivo', [
            'id_alumno' => $escenario['alumno_a']->id,
            'id_objetivo' => $escenario['objetivo_a']->id,
            'nivel_dominio' => 'inicial',
        ]);
    }

    public function test_oneroster_gradebook_exige_scope_y_exporta_solo_la_institucion_del_cliente(): void
    {
        $escenario = $this->escenario();
        $mision = Mision::create([
            'titulo' => 'Misión interoperable',
            'descripcion' => 'Evidencia académica exportable.',
            'recompensa' => 10,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
            'id_institucion' => $escenario['institucion_a']->id,
            'id_aula' => $escenario['aula_a']->id,
            'id_leccion' => $escenario['leccion_a']->id,
            'puntaje_maximo' => 100,
        ]);
        $mision->objetivos()->sync([$escenario['objetivo_a']->id]);
        app(LibroCalificacionesService::class)->registrarResultado(
            $mision,
            $escenario['alumno_a'],
            92,
            $escenario['docente_a'],
            'Buen dominio.',
            'prueba',
            1,
        );

        $auth = app(OneRosterAuthService::class);
        $soloRoster = $auth->crearCliente($escenario['institucion_a']->id, 'SIS solo roster');
        $tokenRoster = $this->postJson('/ims/oneroster/oauth2/token', [
            'grant_type' => 'client_credentials',
            'client_id' => $soloRoster['cliente']->client_id,
            'client_secret' => $soloRoster['client_secret'],
        ])->assertOk()->json('access_token');
        $this->withToken($tokenRoster)->getJson('/ims/oneroster/gradebook/v1p2/lineItems')->assertForbidden();

        $credenciales = $auth->crearCliente(
            $escenario['institucion_a']->id,
            'SIS gradebook',
            [OneRosterAuthService::SCOPE_GRADEBOOK_READONLY, OneRosterAuthService::SCOPE_GRADEBOOK_CORE_READONLY],
        );
        $token = $this->postJson('/ims/oneroster/oauth2/token', [
            'grant_type' => 'client_credentials',
            'client_id' => $credenciales['cliente']->client_id,
            'client_secret' => $credenciales['client_secret'],
            'scope' => OneRosterAuthService::SCOPE_GRADEBOOK_READONLY.' '.OneRosterAuthService::SCOPE_GRADEBOOK_CORE_READONLY,
        ])->assertOk()->json('access_token');

        $this->withToken($token)->getJson('/ims/oneroster/gradebook/v1p2/categories')
            ->assertOk()->assertHeader('X-Total-Count', '1')
            ->assertJsonPath('categories.0.title', 'Misiones');
        $this->withToken($token)->getJson('/ims/oneroster/gradebook/v1p2/lineItems')
            ->assertOk()->assertHeader('X-Total-Count', '1')
            ->assertJsonPath('lineItems.0.class.sourcedId', $escenario['aula_a']->sourced_id)
            ->assertJsonPath('lineItems.0.school.sourcedId', $escenario['institucion_a']->sourced_id);
        $this->withToken($token)->getJson('/ims/oneroster/gradebook/v1p2/results')
            ->assertOk()->assertHeader('X-Total-Count', '1')
            ->assertJsonPath('results.0.student.sourcedId', $escenario['alumno_a']->sourced_id)
            ->assertJsonPath('results.0.score', 92);
    }

    public function test_libro_docente_no_expone_resultados_de_otra_aula_en_items_institucionales(): void
    {
        $escenario = $this->escenario();
        $otraAula = Aula::create([
            'id_institucion' => $escenario['institucion_a']->id,
            'id_curso' => $escenario['curso_a']->id,
            'nombre' => 'Aula A2',
            'nivel' => 'TEENS',
        ]);
        $otroAlumno = $this->usuario('alumno', $escenario['institucion_a'], $otraAula, 'Alumno A2');
        $alumnoSecundario = $this->usuario('alumno', $escenario['institucion_a'], $otraAula, 'Alumno A3');
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $escenario['aula_a']->id,
            'id_usuario' => $alumnoSecundario->id,
            'rol' => 'student',
            'estado' => 'active',
        ]);
        $mision = Mision::create([
            'titulo' => 'Misión de toda la institución',
            'recompensa' => 10,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
            'id_institucion' => $escenario['institucion_a']->id,
            'id_leccion' => $escenario['leccion_a']->id,
            'puntaje_maximo' => 100,
        ]);
        $mision->objetivos()->sync([$escenario['objetivo_a']->id]);
        $libro = app(LibroCalificacionesService::class);
        $libro->registrarResultado($mision, $escenario['alumno_a'], 80, $escenario['docente_a'], null, 'prueba', 1);
        $libro->registrarResultado($mision, $otroAlumno, 90, $escenario['admin'], null, 'prueba', 2);
        $libro->registrarResultado($mision, $alumnoSecundario, 85, $escenario['admin'], null, 'prueba', 3);

        $this->actingAs($escenario['docente_a'])->getJson('/api/v1/academico/libro-calificaciones')
            ->assertOk()
            ->assertJsonPath('resumen.items', 1)
            ->assertJsonPath('resumen.resultados', 2)
            ->assertJsonPath('items.0.resultados.0.id_alumno', $escenario['alumno_a']->id)
            ->assertJsonFragment(['id_alumno' => $alumnoSecundario->id])
            ->assertJsonMissing(['id_alumno' => $otroAlumno->id]);
    }

    private function crearEvaluacion(Usuario $docente, Leccion $leccion, ObjetivoAprendizaje $objetivo): int
    {
        $id = $this->actingAs($docente)->postJson('/api/v1/evaluaciones', [
            'titulo' => 'Evaluación de secuencias',
            'nivel' => 'TEENS',
            'estado' => 'borrador',
            'id_leccion' => $leccion->id,
            'objetivos' => [$objetivo->id],
        ])->assertCreated()->json('id');

        $this->actingAs($docente)->postJson("/api/v1/evaluaciones/{$id}/preguntas", [
            'preguntas' => [[
                'enunciado' => '¿Qué ocurre al inicio?',
                'tipo' => 'texto',
                'respuesta_correcta' => 'Primero',
            ]],
        ])->assertOk();

        return $id;
    }

    /** @return array<string, mixed> */
    private function escenario(): array
    {
        $institucionA = Institucion::create(['nombre' => 'Colegio A', 'slug' => 'colegio-a-'.Str::lower(Str::random(5))]);
        $institucionB = Institucion::create(['nombre' => 'Colegio B', 'slug' => 'colegio-b-'.Str::lower(Str::random(5))]);
        $cursoA = $this->curso($institucionA, 'A');
        $cursoB = $this->curso($institucionB, 'B');
        $aulaA = Aula::create(['id_institucion' => $institucionA->id, 'id_curso' => $cursoA->id, 'nombre' => 'Aula A', 'nivel' => 'TEENS']);
        $aulaB = Aula::create(['id_institucion' => $institucionB->id, 'id_curso' => $cursoB->id, 'nombre' => 'Aula B', 'nivel' => 'TEENS']);
        $unidadA = $this->unidad($cursoA, 'A');
        $unidadB = $this->unidad($cursoB, 'B');
        $leccionA = $this->leccion($unidadA, 'A');
        $leccionB = $this->leccion($unidadB, 'B');
        $objetivoA = $this->objetivo($institucionA, 'A');
        $objetivoB = $this->objetivo($institucionB, 'B');
        $leccionA->objetivos()->sync([$objetivoA->id]);
        $leccionB->objetivos()->sync([$objetivoB->id]);

        return [
            'institucion_a' => $institucionA,
            'institucion_b' => $institucionB,
            'curso_a' => $cursoA,
            'curso_b' => $cursoB,
            'aula_a' => $aulaA,
            'aula_b' => $aulaB,
            'unidad_a' => $unidadA,
            'leccion_a' => $leccionA,
            'leccion_b' => $leccionB,
            'objetivo_a' => $objetivoA,
            'objetivo_b' => $objetivoB,
            'admin' => $this->usuario('admin', $institucionA, null, 'Admin'),
            'docente_a' => $this->usuario('docente', $institucionA, $aulaA, 'Docente A'),
            'docente_b' => $this->usuario('docente', $institucionB, $aulaB, 'Docente B'),
            'alumno_a' => $this->usuario('alumno', $institucionA, $aulaA, 'Alumno A'),
            'alumno_b' => $this->usuario('alumno', $institucionB, $aulaB, 'Alumno B'),
        ];
    }

    private function curso(Institucion $institucion, string $sufijo): Curso
    {
        return Curso::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => "Curso {$sufijo}",
            'codigo' => "CURSO-{$sufijo}",
            'nivel' => 'TEENS',
            'estado' => 'published',
        ]);
    }

    private function unidad(Curso $curso, string $sufijo): UnidadCurso
    {
        return UnidadCurso::create(['id_curso' => $curso->id, 'uuid' => (string) Str::uuid(), 'titulo' => "Unidad {$sufijo}", 'orden' => 1, 'estado' => 'published']);
    }

    private function leccion(UnidadCurso $unidad, string $sufijo): Leccion
    {
        return Leccion::create(['id_unidad' => $unidad->id, 'uuid' => (string) Str::uuid(), 'titulo' => "Lección {$sufijo}", 'orden' => 1, 'estado' => 'published']);
    }

    private function objetivo(Institucion $institucion, string $sufijo): ObjetivoAprendizaje
    {
        return ObjetivoAprendizaje::create(['id_institucion' => $institucion->id, 'uuid' => (string) Str::uuid(), 'codigo' => "OBJ-{$sufijo}", 'descripcion' => "Objetivo {$sufijo}", 'nivel' => 'TEENS']);
    }

    private function usuario(string $rol, Institucion $institucion, ?Aula $aula, string $nombre): Usuario
    {
        return Usuario::create([
            'nombre_completo' => $nombre,
            'usuario' => Str::slug($nombre).'.'.Str::lower(Str::random(5)),
            'password_hash' => bcrypt('secret-123'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
            'id_aula' => $aula?->id,
        ]);
    }
}
