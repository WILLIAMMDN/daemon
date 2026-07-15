<?php

namespace Tests\Feature;

use App\Models\SolicitudPrivacidad;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrivacidadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(str_repeat('p', 32))]);
    }

    public function test_perfil_teens_registra_consentimiento_versionado(): void
    {
        $usuario = $this->usuario(['perfil_completo' => false]);
        Sanctum::actingAs($usuario);

        $this->withHeader('User-Agent', 'DAEMON-Test/1.0')
            ->patchJson('/api/v1/auth/me/perfil', [
                'nombre_completo' => 'Alumno Privacidad',
                'usuario' => 'alumno_privacidad',
                'nivel' => 'TEENS',
                'acepta_privacidad' => true,
            ])
            ->assertOk()
            ->assertJsonPath('usuario.perfil_completo', true);

        $this->assertDatabaseHas('consentimientos_privacidad', [
            'usuario_id' => $usuario->id,
            'audiencia' => 'TEENS',
            'version_politica' => config('privacy.policy_version'),
            'estado' => 'aceptado',
        ]);

        $registro = DB::table('consentimientos_privacidad')->first();
        $this->assertSame(64, strlen($registro->ip_hash));
        $this->assertSame(64, strlen($registro->user_agent_hash));
        $this->assertStringNotContainsString('127.0.0.1', $registro->ip_hash);
    }

    public function test_perfil_kids_exige_tutor_y_cifra_su_correo(): void
    {
        $usuario = $this->usuario(['perfil_completo' => false]);
        Sanctum::actingAs($usuario);

        $payload = [
            'nombre_completo' => 'Alumno Kids',
            'usuario' => 'alumno_kids',
            'nivel' => 'KIDS',
            'acepta_privacidad' => true,
        ];

        $this->patchJson('/api/v1/auth/me/perfil', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email_tutor', 'autorizacion_tutor_declarada']);

        $this->patchJson('/api/v1/auth/me/perfil', [
            ...$payload,
            'email_tutor' => 'tutor@example.com',
            'autorizacion_tutor_declarada' => true,
        ])->assertOk();

        $registro = DB::table('consentimientos_privacidad')->first();
        $this->assertSame('tutor_declarado', $registro->estado);
        $this->assertNotSame('tutor@example.com', $registro->email_tutor);
        $this->assertSame(64, strlen($registro->email_tutor_hash));
        $this->assertStringNotContainsString('tutor@example.com', $registro->email_tutor_hash);
        $this->assertSame('tutor@example.com', $usuario->consentimientosPrivacidad()->first()->email_tutor);
    }

    public function test_usuario_puede_exportar_sus_datos_sin_secretos_de_autenticacion(): void
    {
        $usuario = $this->usuario();
        Sanctum::actingAs($usuario);

        $response = $this->getJson('/api/v1/privacidad/exportar')
            ->assertOk()
            ->assertJsonPath('metadata.formato', 'DAEMON-PRIVACY-EXPORT')
            ->assertJsonPath('cuenta.email', $usuario->email)
            ->assertJsonMissingPath('cuenta.password_hash');

        $this->assertStringContainsString('attachment; filename=', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_solicitud_de_eliminacion_requiere_confirmacion_y_es_idempotente(): void
    {
        $usuario = $this->usuario();
        Sanctum::actingAs($usuario);

        $this->postJson('/api/v1/privacidad/eliminacion', [
            'confirmacion' => 'incorrecto',
        ])->assertUnprocessable()->assertJsonValidationErrors('confirmacion');

        $payload = [
            'confirmacion' => $usuario->email,
            'motivo' => 'Quiero cerrar mi cuenta.',
        ];

        $this->postJson('/api/v1/privacidad/eliminacion', $payload)->assertAccepted();
        $this->postJson('/api/v1/privacidad/eliminacion', $payload)->assertAccepted();

        $this->assertSame(1, SolicitudPrivacidad::query()->count());
        $this->assertNotSame($payload['motivo'], DB::table('solicitudes_privacidad')->value('motivo'));
    }

    private function usuario(array $overrides = []): Usuario
    {
        return Usuario::query()->create(array_merge([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno-privacidad@example.com',
            'usuario' => 'alumno_privacidad_base',
            'password_hash' => 'no-se-exporta',
            'nivel' => 'TEENS',
            'rol' => 'alumno',
            'tokens' => 100,
            'perfil_completo' => true,
        ], $overrides));
    }
}
