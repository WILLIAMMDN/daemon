<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\Usuario;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

require_once __DIR__.'/../../database/seeders/IaOrigenTeensReferenceCourseSeeder.php';

class ArcTeacherFeedbackOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected function migrateUsing(): array
    {
        return [
            '--path' => realpath(__DIR__.'/../../database/migrations'),
            '--realpath' => true,
        ];
    }

    private array $datosCurso;
    private Institucion $institucionA;
    private Institucion $institucionB;
    private Aula $aulaA;
    private Aula $aulaB;
    private Usuario $docenteA;
    private Usuario $docenteB;
    private Usuario $admin;
    private Usuario $alumnoA;
    private MatriculaAula $matriculaA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institucionA = Institucion::create([
            'nombre' => 'DAEMON Innovation School Alpha',
            'slug' => 'daemon-alpha',
        ]);

        $this->institucionB = Institucion::create([
            'nombre' => 'DAEMON Innovation School Beta',
            'slug' => 'daemon-beta',
        ]);

        $this->aulaA = Aula::create([
            'id_institucion' => $this->institucionA->id,
            'nombre' => 'Cohorte IA Teens Alpha',
            'nivel' => 'TEENS',
        ]);

        $this->aulaB = Aula::create([
            'id_institucion' => $this->institucionB->id,
            'nombre' => 'Cohorte IA Teens Beta',
            'nivel' => 'TEENS',
        ]);

        $seeder = new IaOrigenTeensReferenceCourseSeeder;
        $this->datosCurso = $seeder->seedForInstitution($this->institucionA, $this->aulaA);

        $this->docenteA = Usuario::create([
            'nombre_completo' => 'Profesor Carlos Mentor',
            'usuario' => 'carlos-mentor',
            'email' => 'carlos@daemon.test',
            'password_hash' => bcrypt('password123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionA->id,
            'id_aula' => $this->aulaA->id,
        ]);

        $this->docenteB = Usuario::create([
            'nombre_completo' => 'Profesora Elena Ajena',
            'usuario' => 'elena-ajena',
            'email' => 'elena@daemon.test',
            'password_hash' => bcrypt('password123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionB->id,
            'id_aula' => $this->aulaB->id,
        ]);

        $this->admin = Usuario::create([
            'nombre_completo' => 'Admin Academico',
            'usuario' => 'admin-academico',
            'email' => 'admin@daemon.test',
            'password_hash' => bcrypt('password123'),
            'rol' => 'admin',
            'id_institucion' => $this->institucionA->id,
        ]);

        $this->alumnoA = Usuario::create([
            'nombre_completo' => 'Valeria Luna',
            'usuario' => 'valeria-luna',
            'email' => 'valeria@daemon.test',
            'password_hash' => bcrypt('password123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionA->id,
            'id_aula' => $this->aulaA->id,
        ]);

        $this->matriculaA = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aulaA->id,
            'id_version_curso' => $this->datosCurso['version']->id,
            'id_ruta_aprendizaje' => $this->datosCurso['ruta']->id,
            'id_usuario' => $this->alumnoA->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
            'fecha_inicio' => today()->subDays(5),
        ]);
    }

    private function completarE1(): void
    {
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $exp1 = $h1->experiencias->firstWhere('orden', 1);

        $leccionId = $exp1->origen_id ?? $exp1->id;
        $this->actingAs($this->alumnoA)->putJson(
            "/api/v1/alumno/aprendizaje/lecciones/{$leccionId}/progreso",
            ['estado' => 'completed', 'porcentaje' => 100],
        )->assertOk();
    }

    public function test_authorized_teacher_sees_only_permitted_reviewable_attempts_in_queue(): void
    {
        $this->completarE1();

        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);
        $this->assertNotNull($expLab);

        $intentoResp = $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos",
            ['idempotency_key' => 'key-lab-review-001'],
        )->assertCreated();
        $intentoId = $intentoResp->json('id');

        $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            [
                'tipo' => 'lab_output',
                'referencia' => 'Entrené 25 muestras de gatos y 25 de perros. Con fondo oscuro la confianza bajó.',
                'metadatos' => ['tool' => 'Teachable Machine', 'classes' => 2],
            ],
        )->assertOk()->assertJsonPath('estado', 'submitted');

        // Docente A (asignado al aula) consulta la cola de revisiones
        $cola = $this->actingAs($this->docenteA)->getJson('/api/v1/academico/revisiones')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $cola);
        $item = $cola[0];
        $this->assertSame($intentoId, $item['id']);
        $this->assertSame('submitted', $item['status']);
        $this->assertSame('Valeria Luna', $item['student']['name']);
        $this->assertSame('Cohorte IA Teens Alpha', $item['cohort']['name']);
        $this->assertSame('IA: Origen', $item['course']['title']);
        $this->assertSame($expLab->titulo, $item['experience']['title']);
        $this->assertSame('laboratorio', $item['experience']['type']);
        $this->assertCount(1, $item['evidences']);
        $this->assertSame('lab_output', $item['evidences'][0]['type']);
        $this->assertStringContainsString('Entrené 25 muestras', $item['evidences'][0]['reference']);

        // Ver detalle individual
        $detalle = $this->actingAs($this->docenteA)->getJson("/api/v1/academico/revisiones/{$intentoId}")
            ->assertOk()
            ->json('data');
        $this->assertSame($intentoId, $detalle['id']);
        $this->assertNotNull($detalle['experience']['instructions']);
    }

    public function test_unrelated_teacher_cannot_see_or_evaluate_unauthorized_attempts(): void
    {
        $this->completarE1();

        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        $intentoResp = $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos",
            ['idempotency_key' => 'key-lab-review-002'],
        )->assertCreated();
        $intentoId = $intentoResp->json('id');

        $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            ['tipo' => 'lab_output', 'referencia' => 'Reporte confidencial.'],
        )->assertOk();

        // Docente B (de otra institución/aula) consulta la cola -> debe estar vacía
        $colaDocenteB = $this->actingAs($this->docenteB)->getJson('/api/v1/academico/revisiones')
            ->assertOk()
            ->json('data');
        $this->assertCount(0, $colaDocenteB);

        // Docente B intenta ver el detalle directamente -> 403 Forbidden
        $this->actingAs($this->docenteB)->getJson("/api/v1/academico/revisiones/{$intentoId}")
            ->assertForbidden();

        // Docente B intenta evaluar el intento -> 403 Forbidden
        $this->actingAs($this->docenteB)->postJson(
            "/api/v1/academico/intentos/{$intentoId}/evaluar",
            ['aprobado' => true, 'comentario' => 'No debería poder evaluar esto.'],
        )->assertForbidden();
    }

    public function test_student_is_denied_access_to_teacher_review_endpoints(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        $intentoResp = $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos",
            ['idempotency_key' => 'key-denied-attempt'],
        )->assertCreated();
        $intentoId = $intentoResp->json('id');

        // Alumno intenta listar revisiones -> 403 Forbidden
        $this->actingAs($this->alumnoA)->getJson('/api/v1/academico/revisiones')
            ->assertForbidden();

        // Alumno intenta evaluar el intento existente -> 403 Forbidden
        $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/academico/intentos/{$intentoId}/evaluar",
            ['aprobado' => true],
        )->assertForbidden();
    }

    public function test_teacher_evaluates_attempt_with_formative_feedback_and_learning_core_persists(): void
    {
        $this->completarE1();

        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        $intentoResp = $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos",
            ['idempotency_key' => 'key-lab-review-003'],
        )->assertCreated();
        $intentoId = $intentoResp->json('id');

        $this->actingAs($this->alumnoA)->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias",
            [
                'tipo' => 'lab_output',
                'referencia' => 'Entrené 25 muestras de gatos y 25 de perros. Con fondo oscuro la confianza bajó.',
                'metadatos' => ['tool' => 'Teachable Machine', 'classes' => 2],
            ],
        )->assertOk()->assertJsonPath('estado', 'submitted');

        // Docente A evalúa con feedback formativo estructurado
        $payloadEvaluacion = [
            'aprobado' => true,
            'puntaje' => 95,
            'comentario' => 'Excelente delimitación del experimento y análisis de fallo por fondo oscuro.',
            'criterios' => [
                'Recolección de datos' => 'Sobresaliente',
                'Análisis de fallas' => 'Sobresaliente',
            ],
        ];

        $respEvaluacion = $this->actingAs($this->docenteA)->postJson(
            "/api/v1/academico/intentos/{$intentoId}/evaluar",
            $payloadEvaluacion,
        )->assertOk();

        $this->assertTrue($respEvaluacion->json('aprobado'));
        $this->assertSame('evaluated', $respEvaluacion->json('estado'));

        // Verificar persistencia de FeedbackAprendizaje en BD
        $this->assertDatabaseHas('feedback_aprendizaje', [
            'id_intento' => $intentoId,
            'id_autor' => $this->docenteA->id,
            'comentario' => 'Excelente delimitación del experimento y análisis de fallo por fondo oscuro.',
        ]);

        // Verificar que progresos_experiencia se completó vía Learning Core
        $this->assertDatabaseHas('progresos_experiencia', [
            'id_matricula' => $this->matriculaA->id,
            'id_experiencia' => $expLab->id,
            'estado' => 'completed',
            'id_intento_completado' => $intentoId,
        ]);

        // Verificar el ciclo completo: Alumno abre su mapa y ve la retroalimentación en latestFeedback
        $mapa = $this->actingAs($this->alumnoA)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->json();

        $expEnMapa = collect($mapa['milestones'])->flatMap(fn ($m) => $m['experiences'])->firstWhere('id', $expLab->id);
        $this->assertNotNull($expEnMapa);
        $this->assertSame('completed', $expEnMapa['state']);
        $this->assertNotNull($expEnMapa['latestFeedback']);
        $this->assertSame('Excelente delimitación del experimento y análisis de fallo por fondo oscuro.', $expEnMapa['latestFeedback']['comment']);

        // Verificar que en la cola del docente ahora figura como evaluada
        $revisadas = $this->actingAs($this->docenteA)->getJson('/api/v1/academico/revisiones?estado=reviewed')
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $revisadas);
        $this->assertSame('evaluated', $revisadas[0]['status']);
        $this->assertNotNull($revisadas[0]['feedback']);
    }
}
