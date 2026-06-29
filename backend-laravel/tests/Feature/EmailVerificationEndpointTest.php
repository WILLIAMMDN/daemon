<?php

namespace Tests\Feature;

use App\Mail\VerificarCorreoMail;
use App\Models\Usuario;
use App\Services\Auth\EmailVerificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class EmailVerificationEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('a', 32)),
        ]);

        Mail::fake();

        Schema::dropIfExists('usuarios');
        Schema::create('usuarios', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre_completo')->nullable();
            $table->string('email')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('usuario')->nullable()->unique();
            $table->string('password_hash');
            $table->string('nivel')->nullable();
            $table->integer('tokens')->default(0);
            $table->integer('pro_tokens')->nullable();
            $table->string('rango')->nullable();
            $table->text('biografia')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('perfil_completo')->default(true);
            $table->string('rol')->default('alumno');
            $table->unsignedBigInteger('id_institucion')->nullable();
            $table->unsignedBigInteger('id_aula')->nullable();
            $table->string('insignia')->nullable();
            $table->integer('mision_actual')->nullable();
            $table->string('fondo')->nullable();
            $table->string('heroe')->nullable();
            $table->string('genero')->nullable();
            $table->timestamp('fecha_registro')->nullable();
            $table->string('firebase_uid')->nullable();
            $table->string('google_id')->nullable();
        });
    }

    public function test_reenvia_correo_si_usuario_aun_no_esta_verificado(): void
    {
        $usuario = $this->usuario(['email_verified_at' => null]);
        Sanctum::actingAs($usuario);

        $response = $this->postJson('/api/v1/auth/enviar-verificacion');

        $response
            ->assertOk()
            ->assertJsonPath('enviado', true)
            ->assertJsonPath('usuario.email_verificado', false);

        Mail::assertSent(VerificarCorreoMail::class);
    }

    public function test_no_reenvia_si_usuario_ya_esta_verificado(): void
    {
        $usuario = $this->usuario(['email_verified_at' => now()->subMinute()]);
        Sanctum::actingAs($usuario);

        $response = $this->postJson('/api/v1/auth/enviar-verificacion');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Tu correo ya estaba verificado.')
            ->assertJsonPath('enviado', false)
            ->assertJsonPath('usuario.email_verificado', true);

        Mail::assertNothingSent();
    }

    public function test_reporta_error_si_el_envio_falla_para_usuario_no_verificado(): void
    {
        $usuario = $this->usuario(['email_verified_at' => null]);
        Sanctum::actingAs($usuario);

        $servicio = Mockery::mock(EmailVerificationService::class);
        $servicio
            ->shouldReceive('solicitar')
            ->once()
            ->with(Mockery::on(fn (Usuario $arg) => $arg->is($usuario)), true)
            ->andReturn(false);
        $this->app->instance(EmailVerificationService::class, $servicio);

        $response = $this->postJson('/api/v1/auth/enviar-verificacion');

        $response
            ->assertStatus(503)
            ->assertJsonPath('enviado', false)
            ->assertJsonPath('usuario.email_verificado', false);
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
            'perfil_completo' => true,
        ], $overrides));
    }
}
