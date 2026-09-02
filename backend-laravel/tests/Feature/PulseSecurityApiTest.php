<?php

namespace Tests\Feature;

use App\Models\EventoDominio;
use App\Models\PoliticaRecompensaPulse;
use App\Models\Usuario;
use App\Services\Pulse\ProcesadorEventosPulse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PulseSecurityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_read_own_pulse_but_cannot_author_or_forge_progression(): void
    {
        $alumno = $this->usuario('alumno');

        $this->actingAs($alumno)->getJson('/api/v1/alumno/pulse')->assertOk();
        $this->actingAs($alumno)->postJson('/api/v1/pulse/admin/politicas', $this->politicaPayload())->assertForbidden();
        $this->actingAs($alumno)->postJson('/api/v1/pulse/admin/logros', $this->logroPayload())->assertForbidden();
        $this->actingAs($alumno)->postJson('/api/v1/alumno/pulse', ['xp' => 9999, 'daems' => 9999])->assertStatus(405);
        $this->actingAs($alumno)->patchJson('/api/v1/alumno/pulse', ['streak' => 99, 'achievement' => 'forced'])->assertStatus(405);

        $alumno->refresh();
        $this->assertSame(0, $alumno->experiencia);
        $this->assertSame(0, $alumno->tokens);
        $this->assertDatabaseCount('movimientos_economia', 0);
        $this->assertDatabaseCount('eventos_dominio', 0);
    }

    public function test_admin_can_author_typed_policies_and_achievements_but_invalid_events_are_rejected(): void
    {
        $admin = $this->usuario('admin');

        $politica = $this->actingAs($admin)->postJson('/api/v1/pulse/admin/politicas', $this->politicaPayload())
            ->assertCreated()
            ->assertJsonPath('tipo_evento', 'learning.course.completed');
        $this->actingAs($admin)->putJson('/api/v1/pulse/admin/politicas/'.$politica->json('id'), [
            'xp' => 0,
            'daems' => 0,
            'actividad_racha' => false,
        ])->assertUnprocessable();
        $this->actingAs($admin)->postJson('/api/v1/pulse/admin/logros', $this->logroPayload())
            ->assertCreated()
            ->assertJsonPath('tipo_criterio', 'course_completion');
        $this->actingAs($admin)->postJson('/api/v1/pulse/admin/politicas', [
            ...$this->politicaPayload(),
            'clave' => 'invalid-client-event',
            'tipo_evento' => 'client.give_me_xp',
        ])->assertUnprocessable();
    }

    public function test_outbox_command_processes_only_server_created_allowlisted_events(): void
    {
        $alumno = $this->usuario('alumno');
        PoliticaRecompensaPulse::create([
            'clave' => 'course-finish',
            'nombre' => 'Finalización válida',
            'tipo_evento' => 'learning.course.completed',
            'xp' => 30,
            'daems' => 7,
            'repetibilidad' => 'once_per_event',
            'actividad_racha' => true,
            'activa' => true,
        ]);
        $evento = EventoDominio::create([
            'uuid' => (string) Str::uuid(),
            'clave_idempotencia' => 'learning:course:test:completed',
            'tipo' => 'learning.course.completed',
            'agregado_tipo' => 'version_curso',
            'agregado_id' => '10',
            'id_alumno' => $alumno->id,
            'payload' => ['studentId' => $alumno->id, 'courseVersionId' => 10],
            'ocurrido_at' => now(),
            'created_at' => now(),
        ]);

        $this->artisan('pulse:process-outbox')->assertSuccessful();
        $this->assertSame(30, $alumno->refresh()->experiencia);
        $this->assertDatabaseHas('pulse_procesamientos_evento', ['id_evento_dominio' => $evento->id, 'estado' => 'processed']);

        $noPermitido = EventoDominio::create([
            'uuid' => (string) Str::uuid(),
            'tipo' => 'client.give_me_xp',
            'agregado_tipo' => 'client',
            'agregado_id' => 'forged',
            'id_alumno' => $alumno->id,
            'payload' => [],
            'ocurrido_at' => now(),
            'created_at' => now(),
        ]);
        $this->expectException(HttpException::class);
        app(ProcesadorEventosPulse::class)->procesar($noPermitido->id);
    }

    private function usuario(string $rol): Usuario
    {
        return Usuario::create([
            'nombre_completo' => ucfirst($rol).' Pulse',
            'usuario' => $rol.'.pulse.'.Str::lower(Str::random(8)),
            'password_hash' => bcrypt('secret-123'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'experiencia' => 0,
            'tokens' => 0,
        ]);
    }

    private function politicaPayload(): array
    {
        return [
            'clave' => 'course-completion',
            'nombre' => 'Curso completado',
            'tipo_evento' => 'learning.course.completed',
            'xp' => 50,
            'daems' => 10,
            'repetibilidad' => 'once_per_source',
            'actividad_racha' => true,
            'activa' => true,
        ];
    }

    private function logroPayload(): array
    {
        return [
            'clave_pulse' => 'course-completion-achievement',
            'nombre' => 'Curso completado',
            'descripcion' => 'Definición de fixture, no seed de producción.',
            'imagen' => 'img/test-achievement.svg',
            'categoria' => 'progress',
            'activa' => true,
            'repetible' => false,
            'tipo_criterio' => 'course_completion',
            'configuracion_criterio' => [],
        ];
    }
}
