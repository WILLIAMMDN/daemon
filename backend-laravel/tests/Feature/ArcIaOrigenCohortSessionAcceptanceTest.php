<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\PeriodoAcademico;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Flujo de aceptación real sobre la cohorte de referencia IA: Origen Teens V1.
 *
 * Docente abre las sesiones de la cohorte → crea "Semana 1 — ¿La IA piensa?"
 * → el Alumno matriculado la ve en su Agenda → la ve en el resumen del curso
 * → el Docente cambia la hora → el Alumno ve la hora nueva.
 *
 * Nada de esto usa fixtures de frontend: todo pasa por los contratos HTTP.
 */
class ArcIaOrigenCohortSessionAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    private Institucion $institucion;

    private Aula $aula;

    private Usuario $docente;

    private Usuario $alumno;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-03 12:00:00 UTC');

        $this->institucion = Institucion::create([
            'nombre' => 'DAEMON Academy',
            'slug' => 'daemon-academy-acceptance',
        ]);

        $periodo = PeriodoAcademico::create([
            'id_institucion' => $this->institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'IA: Origen Teens — Cohorte piloto 2026',
            'tipo' => 'term',
            'fecha_inicio' => '2026-09-07',
            'fecha_fin' => '2026-10-18',
            'estado' => 'active',
        ]);

        $this->aula = Aula::create([
            'id_institucion' => $this->institucion->id,
            'id_periodo_academico' => $periodo->id,
            'nombre' => 'Cohorte IA Teens 2026',
            'nivel' => 'TEENS',
        ]);

        $datos = (new IaOrigenTeensReferenceCourseSeeder)->seedForInstitution($this->institucion, $this->aula);
        $this->aula->refresh();

        $this->docente = $this->crearUsuario('docente', 'docente-ia-origen');
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_usuario' => $this->docente->id,
            'rol' => 'teacher',
            'estado' => 'active',
        ]);

        $this->alumno = $this->crearUsuario('alumno', 'alumno-ia-origen', $this->aula);
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_version_curso' => $datos['version']->id,
            'id_ruta_aprendizaje' => $datos['ruta']->id,
            'id_usuario' => $this->alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_ia_origen_teacher_to_student_live_session_round_trip(): void
    {
        // 1. El docente abre las sesiones de la cohorte: contexto académico real, sin sesiones.
        $this->actingAs($this->docente)
            ->getJson('/api/v1/academico/cohortes')
            ->assertOk()
            ->assertJsonPath('cohorts.0.id', $this->aula->id)
            ->assertJsonPath('cohorts.0.course.title', 'IA: Origen')
            ->assertJsonPath('cohorts.0.course.code', 'IA-ORIGEN-TEENS')
            ->assertJsonPath('cohorts.0.period.title', 'IA: Origen Teens — Cohorte piloto 2026')
            ->assertJsonPath('cohorts.0.activeStudentCount', 1);

        $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/aulas/{$this->aula->id}/sesiones")
            ->assertOk()
            ->assertJsonPath('nextSession', null)
            ->assertJsonCount(0, 'upcoming');

        // 2. Crea la sesión de la Semana 1.
        $creada = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/aulas/{$this->aula->id}/sesiones", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'descripcion' => 'Guion interno: desarmar el pensamiento mágico sobre la IA.',
                'inicio_at' => '2026-09-07T18:00:00-05:00',
                'fin_at' => '2026-09-07T19:30:00-05:00',
                'acceso_url' => 'https://meet.example.test/ia-origen-semana-1',
            ])
            ->assertCreated()
            ->json();

        $this->assertDatabaseHas('sesiones_aprendizaje', [
            'id' => $creada['id'],
            'id_aula' => $this->aula->id,
            'titulo' => 'Semana 1 — ¿La IA piensa?',
            'estado' => 'scheduled',
        ]);

        $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/aulas/{$this->aula->id}/sesiones")
            ->assertOk()
            ->assertJsonPath('nextSession.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('nextSession.deliveryWeek', 1)
            ->assertJsonPath('delivery.anchorWeekStart', '2026-09-07');

        // 3. El Alumno matriculado la ve en su Agenda, sin el guion interno del docente.
        $this->actingAs($this->alumno)
            ->getJson('/api/v1/alumno/agenda')
            ->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('events.0.startsAt', '2026-09-07T23:00:00Z')
            ->assertJsonPath('events.0.access.joinUrl', 'https://meet.example.test/ia-origen-semana-1')
            ->assertJsonMissingPath('events.0.description');

        // 4. Y en el resumen del curso IA: Origen.
        $this->actingAs($this->alumno)
            ->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('currentCourse.title', 'IA: Origen')
            ->assertJsonPath('nextLiveSession.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('nextLiveSession.startsAt', '2026-09-07T23:00:00Z');

        // 5. El docente mueve la sesión.
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/sesiones/{$creada['id']}", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'descripcion' => 'Guion interno: desarmar el pensamiento mágico sobre la IA.',
                'inicio_at' => '2026-09-07T20:00:00-05:00',
                'fin_at' => '2026-09-07T21:30:00-05:00',
                'acceso_url' => 'https://meet.example.test/ia-origen-semana-1',
            ])
            ->assertOk();

        // 6. El Alumno ve la hora nueva en Agenda y en el resumen del curso.
        $this->actingAs($this->alumno)
            ->getJson('/api/v1/alumno/agenda')
            ->assertOk()
            ->assertJsonPath('events.0.startsAt', '2026-09-08T01:00:00Z')
            ->assertJsonPath('events.0.endsAt', '2026-09-08T02:30:00Z');

        $this->actingAs($this->alumno)
            ->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession.startsAt', '2026-09-08T01:00:00Z');
    }

    private function crearUsuario(string $rol, string $sufijo, ?Aula $aula = null): Usuario
    {
        return Usuario::create([
            'nombre_completo' => Str::title(str_replace('-', ' ', $sufijo)),
            'usuario' => $sufijo,
            'email' => $sufijo.'@example.test',
            'password_hash' => bcrypt('secret-123'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucion->id,
            'id_aula' => $aula?->id,
        ]);
    }
}
