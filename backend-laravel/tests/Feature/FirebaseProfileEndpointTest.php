<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Services\Auth\FirebaseTokenVerifier;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class FirebaseProfileEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('b', 32)),
            'daemon.auth_cookie.expose_bearer_token' => false,
        ]);

        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('consentimientos_privacidad');
        Schema::dropIfExists('usuarios');

        Schema::create('usuarios', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre_completo')->nullable();
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('telefono', 30)->nullable()->unique();
            $table->string('usuario')->nullable()->unique();
            $table->string('password_hash');
            $table->string('nivel')->nullable();
            $table->integer('tokens')->default(0);
            $table->integer('pro_tokens')->nullable();
            $table->string('rango')->nullable();
            $table->text('biografia')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('perfil_completo')->default(false);
            $table->boolean('tour_completado')->default(false);
            $table->string('rol')->default('alumno');
            $table->unsignedBigInteger('id_institucion')->nullable();
            $table->unsignedBigInteger('id_aula')->nullable();
            $table->string('insignia')->nullable();
            $table->integer('mision_actual')->nullable();
            $table->string('fondo')->nullable();
            $table->string('heroe')->nullable();
            $table->string('genero')->nullable();
            $table->timestamp('fecha_registro')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('firebase_uid', 128)->nullable()->unique();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('consentimientos_privacidad', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usuario_id');
            $table->string('audiencia');
            $table->string('version_politica');
            $table->string('estado');
            $table->text('email_tutor')->nullable();
            $table->char('email_tutor_hash', 64)->nullable()->index();
            $table->char('ip_hash', 64)->nullable();
            $table->char('user_agent_hash', 64)->nullable();
            $table->timestamp('aceptado_at');
            $table->timestamp('verificado_at')->nullable();
            $table->timestamp('revocado_at')->nullable();
            $table->timestamps();
            $table->unique(['usuario_id', 'version_politica']);
        });
    }

    public function test_completa_perfil_firebase_sin_cookie_sanctum(): void
    {
        $usuario = $this->usuario([
            'email' => 'nuevo-firebase@example.com',
            'usuario' => null,
            'firebase_uid' => 'firebase-nuevo',
            'perfil_completo' => false,
        ]);

        $this->mockFirebaseClaims([
            'uid' => 'firebase-nuevo',
            'email' => 'nuevo-firebase@example.com',
            'email_verified' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/firebase/perfil', [
            'id_token' => 'firebase-token',
            'nombre_completo' => 'Alumno Nuevo',
            'usuario' => 'alumno_nuevo',
            'nivel' => 'TEENS',
            'acepta_privacidad' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('usuario.usuario', 'alumno_nuevo')
            ->assertJsonPath('usuario.perfil_completo', true)
            ->assertCookie(config('daemon.auth_cookie.name', 'daemon_access'));

        $this->assertTrue($usuario->fresh()->perfil_completo);
        $this->assertSame('Alumno Nuevo', $usuario->fresh()->nombre_completo);
    }

    public function test_rechaza_usuario_duplicado_en_perfil_firebase(): void
    {
        $this->usuario([
            'email' => 'ocupado@example.com',
            'usuario' => 'ocupado',
            'firebase_uid' => 'firebase-ocupado',
            'perfil_completo' => true,
        ]);

        $this->usuario([
            'email' => 'actual@example.com',
            'usuario' => null,
            'firebase_uid' => 'firebase-actual',
            'perfil_completo' => false,
        ]);

        $this->mockFirebaseClaims([
            'uid' => 'firebase-actual',
            'email' => 'actual@example.com',
            'email_verified' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/firebase/perfil', [
            'id_token' => 'firebase-token',
            'nombre_completo' => 'Alumno Actual',
            'usuario' => 'ocupado',
            'nivel' => 'TEENS',
            'acepta_privacidad' => true,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Ese nombre de usuario ya esta en uso.')
            ->assertJsonValidationErrors('usuario');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function usuario(array $overrides = []): Usuario
    {
        return Usuario::create(array_merge([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'rol' => 'alumno',
            'tokens' => 100,
            'perfil_completo' => false,
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function mockFirebaseClaims(array $claims): void
    {
        $verificador = Mockery::mock(FirebaseTokenVerifier::class);
        $verificador
            ->shouldReceive('verify')
            ->once()
            ->with('firebase-token')
            ->andReturn($claims);

        $this->app->instance(FirebaseTokenVerifier::class, $verificador);
    }
}
