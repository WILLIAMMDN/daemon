<?php

namespace Tests\Feature;

use App\Models\ConsentimientoPrivacidad;
use App\Models\Entrega;
use App\Models\Mision;
use App\Models\TutorAlumno;
use App\Models\UsoPantallaDiario;
use App\Models\Usuario;
use App\Services\Auth\AutenticacionService;
use App\Services\Privacidad\PrivacidadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TutorPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.key' => 'base64:'.base64_encode(str_repeat('f', 32))]);
    }

    public function test_tutor_verificado_acepta_invitacion_y_ve_reporte_sin_saldo_del_menor(): void
    {
        $tutor = $this->usuario([
            'nombre_completo' => 'Ana Familiar',
            'email' => 'familia@example.com',
            'usuario' => null,
            'rol' => 'tutor',
            'nivel' => null,
            'tokens' => 0,
            'email_verified_at' => now(),
        ]);
        $alumno = $this->usuario([
            'nombre_completo' => 'Luna Exploradora',
            'email' => 'luna@example.com',
            'usuario' => 'luna_kids',
            'nivel' => 'KIDS',
            'experiencia' => 240,
            'tokens' => 900,
        ]);
        $consentimiento = app(PrivacidadService::class)->registrarConsentimiento($alumno, [
            'nivel' => 'KIDS',
            'email_tutor' => 'Familia@Example.com',
        ], '127.0.0.1', 'DAEMON-Test');
        $mision = Mision::query()->create([
            'titulo' => 'Mision de seguridad',
            'recompensa' => 40,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'KIDS',
            'estado' => 'activo',
        ]);
        Entrega::query()->create([
            'id_desafio' => $mision->id,
            'id_alumno' => $alumno->id,
            'archivo_url' => 'respuesta segura',
            'estado' => 'aprobado',
            'calificacion' => 40,
            'fecha_entrega' => now(),
            'fecha_revision' => now(),
        ]);

        Sanctum::actingAs($tutor);

        $this->getJson('/api/v1/tutor/invitaciones')
            ->assertOk()
            ->assertJsonPath('invitaciones.0.id', $consentimiento->id)
            ->assertJsonPath('invitaciones.0.alumno', 'Luna E.');

        $this->postJson("/api/v1/tutor/invitaciones/{$consentimiento->id}/aceptar", [
            'parentesco' => 'madre',
        ])->assertOk()->assertJsonPath('alumno_id', $alumno->id);

        $this->assertDatabaseHas('tutores_alumnos', [
            'tutor_id' => $tutor->id,
            'alumno_id' => $alumno->id,
            'parentesco' => 'madre',
            'estado' => 'activo',
        ]);
        $this->assertDatabaseHas('consentimientos_privacidad', [
            'id' => $consentimiento->id,
            'estado' => 'verificado',
        ]);

        $this->getJson('/api/v1/tutor/panel')
            ->assertOk()
            ->assertJsonPath('seleccionado.alumno.nombre', 'Luna Exploradora')
            ->assertJsonPath('seleccionado.semana.misiones_aprobadas', 1)
            ->assertJsonPath('seleccionado.semana.xp_aprendizaje', 40)
            ->assertJsonMissingPath('seleccionado.alumno.tokens')
            ->assertJsonPath('seleccionado.membresia.maneja_tarjetas_daemon', false);
    }

    public function test_tutor_sin_correo_verificado_no_puede_descubrir_invitaciones(): void
    {
        $tutor = $this->usuario([
            'email' => 'pendiente@example.com', 'usuario' => null, 'rol' => 'tutor',
            'nivel' => null, 'tokens' => 0, 'email_verified_at' => null,
        ]);
        Sanctum::actingAs($tutor);

        $this->getJson('/api/v1/tutor/invitaciones')
            ->assertForbidden()
            ->assertJsonPath('message', 'Verifica tu correo en Firebase antes de vincular a un menor.');
    }

    public function test_tutor_solo_configura_limite_de_un_alumno_vinculado_y_el_alumno_lo_aplica(): void
    {
        $tutor = $this->usuario([
            'email' => 'tutor-limite@example.com', 'usuario' => null, 'rol' => 'tutor',
            'nivel' => null, 'tokens' => 0, 'email_verified_at' => now(),
        ]);
        $alumno = $this->usuario(['email' => 'kid-limite@example.com', 'usuario' => 'kid_limite', 'nivel' => 'KIDS']);
        $otro = $this->usuario(['email' => 'otro-kid@example.com', 'usuario' => 'otro_kid', 'nivel' => 'KIDS']);
        TutorAlumno::query()->create([
            'tutor_id' => $tutor->id, 'alumno_id' => $alumno->id, 'parentesco' => 'padre',
            'estado' => 'activo', 'verificado_at' => now(),
        ]);
        Sanctum::actingAs($tutor);
        $payload = [
            'activo' => true,
            'max_minutos_diarios' => 30,
            'hora_silencio_inicio' => null,
            'hora_silencio_fin' => null,
            'zona_horaria' => 'America/Lima',
        ];

        $this->putJson("/api/v1/tutor/alumnos/{$otro->id}/limite-pantalla", $payload)->assertForbidden();
        $this->putJson("/api/v1/tutor/alumnos/{$alumno->id}/limite-pantalla", $payload)
            ->assertOk()
            ->assertJsonPath('bienestar_digital.activo', true);

        UsoPantallaDiario::query()->create([
            'alumno_id' => $alumno->id,
            'fecha_local' => now('America/Lima')->toDateString(),
            'segundos_activos' => 1790,
        ]);
        Sanctum::actingAs($alumno);
        $this->postJson('/api/v1/alumno/bienestar-digital/latido', ['segundos' => 15])
            ->assertOk()
            ->assertJsonPath('bienestar_digital.bloqueado', true)
            ->assertJsonPath('bienestar_digital.motivo', 'limite_diario')
            ->assertJsonPath('bienestar_digital.minutos_restantes', 0);
    }

    public function test_cuenta_tutor_firebase_es_separada_y_no_hereda_privilegios_academicos(): void
    {
        $servicio = app(AutenticacionService::class);
        $tutor = $servicio->autenticarTutorConFirebase([
            'uid' => 'firebase-tutor-1',
            'email' => 'adulto@example.com',
            'email_verified' => true,
            'name' => 'Adulto Responsable',
        ], true);

        $this->assertSame('tutor', $tutor?->rol);
        $this->assertSame(0, $tutor?->tokens);
        $this->assertTrue($tutor?->hasVerifiedEmail());

        Sanctum::actingAs($tutor);
        $this->getJson('/api/v1/misiones')->assertForbidden();
        $this->postJson('/api/v1/archivos', [])->assertForbidden();

        $this->usuario(['email' => 'ocupado@example.com', 'usuario' => 'ocupado']);
        $this->expectException(InvalidArgumentException::class);
        $servicio->autenticarTutorConFirebase([
            'uid' => 'firebase-tutor-2',
            'email' => 'ocupado@example.com',
            'email_verified' => true,
        ], true);
    }

    public function test_retencion_elimina_solo_uso_de_pantalla_vencido(): void
    {
        $alumno = $this->usuario();
        UsoPantallaDiario::query()->create([
            'alumno_id' => $alumno->id,
            'fecha_local' => now()->subDays(60)->toDateString(),
            'segundos_activos' => 300,
        ]);
        UsoPantallaDiario::query()->create([
            'alumno_id' => $alumno->id,
            'fecha_local' => now()->toDateString(),
            'segundos_activos' => 120,
        ]);

        $this->artisan('daemon:aplicar-retencion --confirm')->assertSuccessful();
        $this->assertSame(1, DB::table('uso_pantalla_diario')->count());
        $this->assertSame(1, DB::table('uso_pantalla_diario')->whereDate('fecha_local', now()->toDateString())->count());
    }

    private function usuario(array $overrides = []): Usuario
    {
        static $contador = 0;
        $contador++;

        return Usuario::query()->create(array_merge([
            'nombre_completo' => 'Usuario DAEMON',
            'email' => "usuario-{$contador}@example.com",
            'usuario' => "usuario_{$contador}",
            'password_hash' => 'hash-local',
            'nivel' => 'TEENS',
            'rol' => 'alumno',
            'tokens' => 100,
            'experiencia' => 0,
            'perfil_completo' => true,
        ], $overrides));
    }
}
