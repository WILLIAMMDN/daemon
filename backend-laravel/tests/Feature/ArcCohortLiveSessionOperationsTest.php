<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\PeriodoAcademico;
use App\Models\SesionAprendizaje;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * DAEMON ARC — Cohort & Live Session Operations.
 *
 * Cubre la operación docente real sobre sesiones en vivo de una cohorte y su
 * propagación canónica al Alumno (Agenda + contexto de curso).
 */
class ArcCohortLiveSessionOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-02 15:00:00 UTC');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_authorized_teacher_lists_only_cohorts_with_real_course_and_period_context(): void
    {
        $escenario = $this->escenario('lista');
        $ajena = $this->escenario('ajena');

        $respuesta = $this->actingAs($escenario['docente'])
            ->getJson('/api/v1/academico/cohortes')
            ->assertOk()
            ->assertJsonCount(1, 'cohorts')
            ->assertJsonPath('cohorts.0.id', $escenario['aula']->id)
            ->assertJsonPath('cohorts.0.course.id', $escenario['curso']->id)
            ->assertJsonPath('cohorts.0.period.id', $escenario['periodo']->id)
            ->assertJsonPath('cohorts.0.activeStudentCount', 1);

        $this->assertNotContains(
            $ajena['aula']->id,
            array_column($respuesta->json('cohorts'), 'id'),
        );
    }

    public function test_authorized_teacher_creates_a_session_that_becomes_backend_truth(): void
    {
        $escenario = $this->escenario('crear');

        $this->actingAs($escenario['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'descripcion' => 'Nota interna del docente para la clase inaugural.',
                'inicio_at' => '2026-09-07T18:00:00-05:00',
                'fin_at' => '2026-09-07T19:30:00-05:00',
                'acceso_url' => 'https://meet.example.test/ia-origen-s1',
            ])
            ->assertCreated()
            ->assertJsonPath('estado', 'scheduled')
            ->assertJsonPath('tipo', 'live')
            ->assertJsonPath('id_aula', $escenario['aula']->id)
            ->assertJsonPath('id_creador', $escenario['docente']->id);

        $this->assertDatabaseHas('sesiones_aprendizaje', [
            'id_aula' => $escenario['aula']->id,
            'titulo' => 'Semana 1 — ¿La IA piensa?',
            'estado' => 'scheduled',
        ]);

        $this->actingAs($escenario['docente'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertOk()
            ->assertJsonPath('nextSession.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('nextSession.startsAt', '2026-09-07T23:00:00Z')
            ->assertJsonPath('nextSession.durationMinutes', 90)
            ->assertJsonPath('nextSession.deliveryWeek', 1)
            ->assertJsonCount(1, 'upcoming')
            ->assertJsonCount(0, 'past');
    }

    public function test_authorized_teacher_edits_a_future_session_through_the_canonical_contract(): void
    {
        $escenario = $this->escenario('editar');
        $sesion = $this->crearSesion($escenario['aula'], 'Semana 1 — ¿La IA piensa?', '2026-09-07 23:00:00');

        $this->actingAs($escenario['docente'])
            ->putJson("/api/v1/academico/sesiones/{$sesion->id}", [
                'titulo' => 'Semana 1 — ¿La IA piensa? (nuevo horario)',
                'inicio_at' => '2026-09-07T20:00:00-05:00',
                'fin_at' => '2026-09-07T21:00:00-05:00',
                'acceso_url' => 'https://meet.example.test/ia-origen-s1',
            ])
            ->assertOk()
            ->assertJsonPath('titulo', 'Semana 1 — ¿La IA piensa? (nuevo horario)');

        $this->assertSame(
            '2026-09-08T01:00:00Z',
            SesionAprendizaje::findOrFail($sesion->id)->inicio_at->utc()->toIso8601ZuluString(),
        );
    }

    public function test_canonical_cancellation_marks_the_session_cancelled_and_hides_it_from_next_session(): void
    {
        $escenario = $this->escenario('cancelar');
        $sesion = $this->crearSesion($escenario['aula'], 'Semana 2 — Datos', '2026-09-14 23:00:00');

        $this->actingAs($escenario['docente'])
            ->putJson("/api/v1/academico/sesiones/{$sesion->id}", [
                'titulo' => $sesion->titulo,
                'inicio_at' => $sesion->inicio_at->toIso8601ZuluString(),
                'fin_at' => $sesion->fin_at->toIso8601ZuluString(),
                'estado' => 'cancelled',
            ])
            ->assertOk()
            ->assertJsonPath('estado', 'cancelled');

        $this->actingAs($escenario['docente'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertOk()
            ->assertJsonPath('nextSession', null)
            ->assertJsonCount(0, 'upcoming')
            ->assertJsonCount(1, 'cancelled');

        $this->actingAs($escenario['alumno'])
            ->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession', null);
    }

    public function test_unrelated_teacher_of_the_same_institution_cannot_read_or_author_cohort_sessions(): void
    {
        $escenario = $this->escenario('aislar');
        $ajeno = $this->crearUsuario($escenario['institucion'], 'docente', 'docente-ajeno');
        $sesion = $this->crearSesion($escenario['aula'], 'Semana 1', '2026-09-07 23:00:00');

        $this->actingAs($ajeno)
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertForbidden();

        $this->actingAs($ajeno)
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Intrusión',
                'inicio_at' => '2026-09-08T23:00:00Z',
            ])
            ->assertForbidden();

        $this->actingAs($ajeno)
            ->putJson("/api/v1/academico/sesiones/{$sesion->id}", [
                'titulo' => 'Intrusión',
                'inicio_at' => '2026-09-08T23:00:00Z',
            ])
            ->assertForbidden();
    }

    public function test_teacher_from_another_institution_is_denied(): void
    {
        $escenario = $this->escenario('inst-a');
        $otra = $this->escenario('inst-b');

        $this->actingAs($otra['docente'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertForbidden();

        $this->actingAs($otra['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Intrusión',
                'inicio_at' => '2026-09-08T23:00:00Z',
            ])
            ->assertForbidden();
    }

    public function test_student_cannot_reach_cohort_session_authoring_or_operations_endpoints(): void
    {
        $escenario = $this->escenario('alumno-denegado');
        $sesion = $this->crearSesion($escenario['aula'], 'Semana 1', '2026-09-07 23:00:00');

        $this->actingAs($escenario['alumno'])
            ->getJson('/api/v1/academico/cohortes')
            ->assertForbidden();

        $this->actingAs($escenario['alumno'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertForbidden();

        $this->actingAs($escenario['alumno'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Sesión no autorizada',
                'inicio_at' => '2026-09-08T23:00:00Z',
            ])
            ->assertForbidden();

        $this->actingAs($escenario['alumno'])
            ->putJson("/api/v1/academico/sesiones/{$sesion->id}", [
                'titulo' => 'Sesión no autorizada',
                'inicio_at' => '2026-09-08T23:00:00Z',
            ])
            ->assertForbidden();
    }

    public function test_cohort_session_list_is_scoped_to_the_selected_cohort_only(): void
    {
        $escenario = $this->escenario('scope');
        $otraAula = Aula::create([
            'id_institucion' => $escenario['institucion']->id,
            'id_curso' => $escenario['curso']->id,
            'id_periodo_academico' => $escenario['periodo']->id,
            'nombre' => 'Cohorte paralela',
            'codigo' => 'COH-'.Str::upper(Str::random(6)),
            'nivel' => 'TEENS',
        ]);
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $otraAula->id,
            'id_usuario' => $escenario['docente']->id,
            'rol' => 'teacher',
            'estado' => 'active',
        ]);
        $this->crearSesion($escenario['aula'], 'De la cohorte A', '2026-09-07 23:00:00');
        $this->crearSesion($otraAula, 'De la cohorte B', '2026-09-08 23:00:00');

        $this->actingAs($escenario['docente'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertOk()
            ->assertJsonCount(1, 'upcoming')
            ->assertJsonPath('upcoming.0.title', 'De la cohorte A');

        $this->actingAs($escenario['docente'])
            ->getJson("/api/v1/academico/aulas/{$otraAula->id}/sesiones")
            ->assertOk()
            ->assertJsonCount(1, 'upcoming')
            ->assertJsonPath('upcoming.0.title', 'De la cohorte B');
    }

    public function test_date_range_filter_selects_only_sessions_inside_the_window(): void
    {
        $escenario = $this->escenario('rango');
        $this->crearSesion($escenario['aula'], 'Antes del rango', '2026-09-07 23:00:00');
        $this->crearSesion($escenario['aula'], 'Dentro del rango', '2026-09-14 23:00:00');
        $this->crearSesion($escenario['aula'], 'Después del rango', '2026-09-28 23:00:00');

        $this->actingAs($escenario['docente'])
            ->getJson('/api/v1/academico/aulas/'.$escenario['aula']->id.'/sesiones?'.http_build_query([
                'start' => '2026-09-14T00:00:00Z',
                'end' => '2026-09-21T00:00:00Z',
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'upcoming')
            ->assertJsonPath('upcoming.0.title', 'Dentro del rango');
    }

    public function test_weekly_delivery_grouping_is_derived_from_real_session_dates(): void
    {
        $escenario = $this->escenario('semanas');
        foreach (range(0, 5) as $indice) {
            $this->crearSesion(
                $escenario['aula'],
                'Semana '.($indice + 1),
                CarbonImmutable::parse('2026-09-07 23:00:00')->addWeeks($indice)->toDateTimeString(),
            );
        }

        $respuesta = $this->actingAs($escenario['docente'])
            ->getJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones")
            ->assertOk()
            ->assertJsonPath('delivery.anchorWeekStart', '2026-09-07')
            ->assertJsonCount(6, 'delivery.weeks');

        $this->assertSame([1, 2, 3, 4, 5, 6], array_column($respuesta->json('delivery.weeks'), 'week'));
        $this->assertSame('Semana 6', $respuesta->json('delivery.weeks.5.sessions.0.title'));
    }

    public function test_enrolled_student_agenda_receives_the_session_created_by_the_teacher(): void
    {
        $escenario = $this->escenario('agenda');
        $ajeno = $this->escenario('agenda-ajena');

        $this->actingAs($escenario['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'descripcion' => 'Nota interna del docente.',
                'inicio_at' => '2026-09-07T18:00:00-05:00',
                'fin_at' => '2026-09-07T19:30:00-05:00',
                'acceso_url' => 'https://meet.example.test/ia-origen-s1',
            ])
            ->assertCreated();

        $this->actingAs($escenario['alumno'])
            ->getJson('/api/v1/alumno/agenda')
            ->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('events.0.type', 'live_session')
            ->assertJsonPath('events.0.startsAt', '2026-09-07T23:00:00Z')
            ->assertJsonPath('events.0.endsAt', '2026-09-08T00:30:00Z')
            ->assertJsonPath('events.0.status', 'scheduled')
            ->assertJsonPath('events.0.access.joinUrl', 'https://meet.example.test/ia-origen-s1')
            ->assertJsonPath('events.0.cohort.id', $escenario['aula']->id)
            ->assertJsonMissingPath('events.0.description');

        $this->actingAs($ajeno['alumno'])
            ->getJson('/api/v1/alumno/agenda')
            ->assertOk()
            ->assertJsonCount(0, 'events');
    }

    public function test_course_summary_next_live_session_follows_teacher_updates(): void
    {
        $escenario = $this->escenario('resumen');

        $creada = $this->actingAs($escenario['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'inicio_at' => '2026-09-07T18:00:00-05:00',
                'fin_at' => '2026-09-07T19:30:00-05:00',
            ])
            ->assertCreated()
            ->json();

        $this->actingAs($escenario['alumno'])
            ->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession.title', 'Semana 1 — ¿La IA piensa?')
            ->assertJsonPath('nextLiveSession.startsAt', '2026-09-07T23:00:00Z')
            ->assertJsonPath('upcomingAgendaSummary.total', 1);

        $this->actingAs($escenario['docente'])
            ->putJson("/api/v1/academico/sesiones/{$creada['id']}", [
                'titulo' => 'Semana 1 — ¿La IA piensa?',
                'inicio_at' => '2026-09-07T20:00:00-05:00',
                'fin_at' => '2026-09-07T21:30:00-05:00',
            ])
            ->assertOk();

        $this->actingAs($escenario['alumno'])
            ->getJson('/api/v1/alumno/home-context')
            ->assertOk()
            ->assertJsonPath('nextLiveSession.startsAt', '2026-09-08T01:00:00Z')
            ->assertJsonPath('nextLiveSession.endsAt', '2026-09-08T02:30:00Z');
    }

    public function test_session_validation_rejects_invalid_time_window_and_meeting_url(): void
    {
        $escenario = $this->escenario('validacion');

        $this->actingAs($escenario['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Ventana inválida',
                'inicio_at' => '2026-09-07T19:00:00Z',
                'fin_at' => '2026-09-07T18:00:00Z',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('fin_at');

        $this->actingAs($escenario['docente'])
            ->postJson("/api/v1/academico/aulas/{$escenario['aula']->id}/sesiones", [
                'titulo' => 'Enlace inválido',
                'inicio_at' => '2026-09-07T19:00:00Z',
                'acceso_url' => 'javascript:alert(1)',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('acceso_url');
    }

    /**
     * @return array{institucion: Institucion, periodo: PeriodoAcademico, curso: Curso, aula: Aula, docente: Usuario, alumno: Usuario}
     */
    private function escenario(string $sufijo): array
    {
        $institucion = Institucion::create([
            'nombre' => 'Institución '.$sufijo,
            'slug' => 'institucion-'.$sufijo.'-'.Str::lower(Str::random(6)),
        ]);
        $periodo = PeriodoAcademico::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'IA: Origen Teens — Cohorte 2026',
            'tipo' => 'term',
            'fecha_inicio' => '2026-09-07',
            'fecha_fin' => '2026-10-18',
            'estado' => 'active',
        ]);
        $curso = Curso::create([
            'id_institucion' => $institucion->id,
            'sourced_id' => (string) Str::uuid(),
            'titulo' => 'IA: Origen '.$sufijo,
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

        $docente = $this->crearUsuario($institucion, 'docente', 'docente-'.$sufijo);
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $aula->id,
            'id_usuario' => $docente->id,
            'rol' => 'teacher',
            'estado' => 'active',
            'fecha_inicio' => '2026-09-01',
        ]);

        $alumno = $this->crearUsuario($institucion, 'alumno', 'alumno-'.$sufijo, $aula);
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $aula->id,
            'id_usuario' => $alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
            'fecha_inicio' => '2026-09-01',
        ]);

        return compact('institucion', 'periodo', 'curso', 'aula', 'docente', 'alumno');
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
            'fin_at' => CarbonImmutable::parse($inicio)->addMinutes(90),
            'tipo' => 'live',
            'estado' => $estado,
            'acceso_url' => 'https://meet.example.test/ia-origen',
        ]);
    }
}
