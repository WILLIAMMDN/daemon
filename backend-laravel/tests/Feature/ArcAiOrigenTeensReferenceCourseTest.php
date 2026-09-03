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

class ArcAiOrigenTeensReferenceCourseTest extends TestCase
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
    private Institucion $institucion;
    private Aula $aula;
    private Usuario $alumno;
    private MatriculaAula $matricula;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institucion = Institucion::create([
            'nombre' => 'DAEMON Innovation School',
            'slug' => 'daemon-innovation',
        ]);

        $this->aula = Aula::create([
            'id_institucion' => $this->institucion->id,
            'nombre' => 'Cohorte IA Teens 2026',
            'nivel' => 'TEENS',
        ]);

        $seeder = new IaOrigenTeensReferenceCourseSeeder;
        $this->datosCurso = $seeder->seedForInstitution($this->institucion, $this->aula);

        $this->alumno = Usuario::create([
            'nombre_completo' => 'Valeria Luna',
            'usuario' => 'valeria-luna',
            'email' => 'valeria@daemon.test',
            'password_hash' => bcrypt('password123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucion->id,
            'id_aula' => $this->aula->id,
        ]);

        $this->matricula = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_version_curso' => $this->datosCurso['version']->id,
            'id_ruta_aprendizaje' => $this->datosCurso['ruta']->id,
            'id_usuario' => $this->alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);
    }

    public function test_course_and_version_and_path_have_correct_immutable_structure(): void
    {
        $curso = $this->datosCurso['curso'];
        $version = $this->datosCurso['version'];
        $ruta = $this->datosCurso['ruta'];

        $this->assertSame('IA: Origen', $curso->titulo);
        $this->assertSame('IA-ORIGEN-TEENS', $curso->codigo);
        $this->assertSame('TEENS', $curso->nivel);
        $this->assertSame('published', $curso->estado);

        $this->assertSame(1, $version->numero);
        $this->assertSame('IA_ORIGEN_TEENS_2026_V1', $version->titulo);
        $this->assertSame('TEENS', $version->audiencia instanceof \BackedEnum ? $version->audiencia->value : (string) $version->audiencia);
        $this->assertSame('inicial', $version->etapa instanceof \BackedEnum ? $version->etapa->value : (string) $version->etapa);
        $this->assertSame('published', $version->estado);

        $this->assertSame('IA: Origen', $ruta->titulo);
        $this->assertSame('TEENS', $ruta->audiencia->value);
        $this->assertSame('inicial', $ruta->etapa->value);
        $this->assertSame('published', $ruta->estado);
    }

    public function test_course_has_exactly_six_sequential_milestones_with_no_prerequisite_cycles(): void
    {
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.prerrequisitos', 'hitos.experiencias']);
        $hitos = $ruta->hitos->sortBy('orden')->values();

        $this->assertCount(6, $hitos);

        $titulosEsperados = [
            1 => '¿La IA piensa?',
            2 => '¿Por qué la IA responde eso?',
            3 => '¿Puedes creerle a una respuesta que suena perfecta?',
            4 => '¿Qué deberías delegar a una IA?',
            5 => '¿Qué problema vale la pena resolver?',
            6 => '¿Funciona de verdad?',
        ];

        foreach ($hitos as $idx => $hito) {
            $orden = $idx + 1;
            $this->assertSame($orden, $hito->orden);
            $this->assertSame($titulosEsperados[$orden], $hito->titulo);
            $this->assertTrue($hito->obligatorio);

            if ($orden === 1) {
                $this->assertEmpty($hito->prerrequisitos);
            } else {
                $this->assertCount(1, $hito->prerrequisitos);
                $this->assertSame($hitos[$idx - 1]->id, $hito->prerrequisitos->first()->id);
            }
        }
    }

    public function test_course_has_exactly_eighteen_experiences_with_correct_pedagogical_types_and_objectives(): void
    {
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $experiencias = $ruta->hitos->flatMap->experiencias;

        $this->assertCount(18, $experiencias);

        // Verificar distribución exacta de 3 por hito
        foreach ($ruta->hitos as $hito) {
            $this->assertCount(3, $hito->experiencias);
        }

        // Verificar que los 6 objetivos AI-01 a AI-06 están conectados
        $codigosConectados = $experiencias->flatMap->objetivos->pluck('codigo')->unique()->sort()->values()->all();
        $this->assertSame(['AI-01', 'AI-02', 'AI-03', 'AI-04', 'AI-05', 'AI-06'], $codigosConectados);

        // Verificar los 7 tipos representados
        $tipos = $experiencias->pluck('tipo.value')->unique()->sort()->values()->all();
        $this->assertContains('leccion', $tipos);
        $this->assertContains('practica', $tipos);
        $this->assertContains('mision', $tipos);
        $this->assertContains('laboratorio', $tipos);
        $this->assertContains('evaluacion', $tipos);
        $this->assertContains('proyecto', $tipos);
        $this->assertContains('desafio', $tipos);

        // Verificar que ninguna experiencia tiene contenido vacío
        foreach ($experiencias as $exp) {
            $this->assertNotEmpty($exp->titulo);
            $this->assertNotEmpty($exp->descripcion, "Experience {$exp->titulo} (order {$exp->orden} in milestone {$exp->id_hito}) has empty descripcion");
            $this->assertNotNull($exp->contenido, "Experience {$exp->titulo} has null contenido");
        }
    }

    public function test_student_enrollment_isolates_access(): void
    {
        // Alumno matriculado ve el curso
        $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprendizaje')
            ->assertOk()
            ->assertJsonPath('cursos.0.titulo', 'IA: Origen')
            ->assertJsonPath('cursos.0.nivel', 'TEENS');

        $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('path.title', 'IA: Origen')
            ->assertJsonPath('milestones.0.title', '¿La IA piensa?')
            ->assertJsonPath('milestones.0.state', 'unlocked')
            ->assertJsonPath('milestones.1.state', 'locked');

        // Alumno de otra aula sin matrícula no ve este curso
        $otro = Usuario::create([
            'nombre_completo' => 'Mateo Soto',
            'usuario' => 'mateo-soto',
            'email' => 'mateo@daemon.test',
            'password_hash' => bcrypt('secret'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucion->id,
        ]);

        $this->actingAs($otro)->getJson('/api/v1/alumno/aprendizaje')
            ->assertOk()
            ->assertJsonPath('cursos', []);

        $this->actingAs($otro)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->assertJsonPath('path', null)
            ->assertJsonPath('milestones', []);
    }

    public function test_end_to_end_progression_unlocks_milestone_two_and_emits_domain_events(): void
    {
        // 1. Estado Inicial: M1 desbloqueado, M1-E1 es actual, M2 a M6 bloqueados
        $mapaInicial = $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprender/mapa')
            ->assertOk()
            ->json();

        $this->assertSame('unlocked', $mapaInicial['milestones'][0]['state']);
        $this->assertSame('current', $mapaInicial['milestones'][0]['experiences'][0]['state']);
        $this->assertSame('locked', $mapaInicial['milestones'][1]['state']);
        $this->assertSame('locked', $mapaInicial['milestones'][5]['state']);

        $m1e1 = $mapaInicial['milestones'][0]['experiences'][0];
        $this->assertSame('IA no es magia', $m1e1['title']);
        $this->assertSame($m1e1['id'], $mapaInicial['nextItem']['id']);

        // 2. Completar M1-E1 (Lección)
        $leccionId = $m1e1['sourceId'];
        $this->assertNotNull($leccionId);

        $this->actingAs($this->alumno)->putJson("/api/v1/alumno/aprendizaje/lecciones/{$leccionId}/progreso", [
            'estado' => 'completed',
            'porcentaje' => 100,
        ])->assertOk();

        // Verificar avance a M1-E2
        $mapaTrasE1 = $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprender/mapa')->json();
        $this->assertSame('completed', $mapaTrasE1['milestones'][0]['experiences'][0]['state']);
        $this->assertSame('current', $mapaTrasE1['milestones'][0]['experiences'][1]['state']);
        $m1e2 = $mapaTrasE1['milestones'][0]['experiences'][1];
        $this->assertSame('Entrena, prueba y rompe un modelo simple', $m1e2['title']);
        $this->assertSame($m1e2['id'], $mapaTrasE1['nextItem']['id']);

        // 3. Completar M1-E2 (Laboratorio con intento y evidencia)
        $intentoE2 = $this->actingAs($this->alumno)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$m1e2['id']}/intentos",
            ['idempotency_key' => 'intento-m1e2-valeria-1'],
        )->assertCreated()->json();

        $this->actingAs($this->alumno)->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoE2['id']}/evidencias",
            [
                'tipo' => 'lab_output',
                'referencia' => 'Entrené un clasificador con 30 imágenes de manzanas y plátanos. Con fondo oscuro falló al 60%.',
                'metadatos' => ['herramienta' => 'teachable_machine', 'clases' => 2],
            ],
        )->assertOk();

        // Verificar avance a M1-E3
        $mapaTrasE2 = $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprender/mapa')->json();
        $this->assertSame('completed', $mapaTrasE2['milestones'][0]['experiences'][1]['state']);
        $this->assertSame('current', $mapaTrasE2['milestones'][0]['experiences'][2]['state']);
        $m1e3 = $mapaTrasE2['milestones'][0]['experiences'][2];
        $this->assertSame('Radiografía de una IA cotidiana', $m1e3['title']);
        $this->assertSame($m1e3['id'], $mapaTrasE2['nextItem']['id']);

        // 4. Completar M1-E3 (Misión con entrega de evidencia)
        $intentoE3 = $this->actingAs($this->alumno)->postJson(
            "/api/v1/alumno/aprender/experiencias/{$m1e3['id']}/intentos",
            ['idempotency_key' => 'intento-m1e3-valeria-1'],
        )->assertCreated()->json();

        $this->actingAs($this->alumno)->postJson(
            "/api/v1/alumno/aprender/intentos/{$intentoE3['id']}/evidencias",
            [
                'tipo' => 'mission_delivery',
                'referencia' => 'Analicé el autocorrector del móvil: entrada (teclas), modelo (n-gramas probabilísticos), salida (sugerencia de palabra).',
            ],
        )->assertOk();

        // 5. ¡Hito 1 completado! Verificar que Hito 2 se desbloquea a través del Learning Core
        $mapaTrasM1 = $this->actingAs($this->alumno)->getJson('/api/v1/alumno/aprender/mapa')->json();

        $this->assertSame('completed', $mapaTrasM1['milestones'][0]['state']);
        $this->assertSame('unlocked', $mapaTrasM1['milestones'][1]['state']);
        $this->assertSame('current', $mapaTrasM1['milestones'][1]['experiences'][0]['state']);
        $this->assertSame('De una idea vaga a una instrucción verificable', $mapaTrasM1['nextItem']['title']);

        // Hitos 3, 4, 5 y 6 deben permanecer bloqueados
        $this->assertSame('locked', $mapaTrasM1['milestones'][2]['state']);
        $this->assertSame('locked', $mapaTrasM1['milestones'][3]['state']);
        $this->assertSame('locked', $mapaTrasM1['milestones'][4]['state']);
        $this->assertSame('locked', $mapaTrasM1['milestones'][5]['state']);

        // 6. Verificar que se emitieron los eventos de dominio correspondientes en outbox
        $eventos = \Illuminate\Support\Facades\DB::table('eventos_dominio')->where('id_alumno', $this->alumno->id)->pluck('tipo')->all();

        $this->assertContains('learning.lesson.completed', $eventos);
        $this->assertContains('learning.experience.submitted', $eventos);
        $this->assertContains('learning.experience.completed', $eventos);
        $this->assertContains('learning.milestone.completed', $eventos);
        $this->assertContains('learning.path.progressed', $eventos);
    }
}
