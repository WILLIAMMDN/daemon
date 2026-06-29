<?php

namespace Tests\Unit;

use App\Mail\VerificarCorreoMail;
use App\Models\Usuario;
use App\Services\Auth\EmailVerificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class EmailVerificationServiceTest extends TestCase
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
            $table->string('nombre_completo');
            $table->string('email')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('usuario')->unique();
            $table->string('password_hash');
            $table->string('firebase_uid')->nullable();
            $table->string('google_id')->nullable();
            $table->string('nivel')->default('TEENS');
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->boolean('perfil_completo')->default(true);
        });
    }

    public function test_solicitar_envia_correo_de_verificacion(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $resultado = app(EmailVerificationService::class)->solicitar($usuario);

        $this->assertTrue($resultado);
        Mail::assertSent(VerificarCorreoMail::class, function (VerificarCorreoMail $mail) use ($usuario) {
            return $mail->hasTo($usuario->email) && $mail->usuario->is($usuario);
        });
    }

    public function test_solicitar_no_envia_si_usuario_sin_correo(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => null,
            'usuario' => 'sinmail',
            'password_hash' => 'irrelevant',
        ]);

        $resultado = app(EmailVerificationService::class)->solicitar($usuario);

        $this->assertFalse($resultado);
        Mail::assertNothingSent();
    }

    public function test_solicitar_no_envia_si_ya_verificado_sin_forzar(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'email_verified_at' => now()->subDay(),
        ]);

        $resultado = app(EmailVerificationService::class)->solicitar($usuario);

        $this->assertFalse($resultado);
        Mail::assertNothingSent();
    }

    public function test_solicitar_con_forzar_no_reenvia_si_ya_verificado(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'email_verified_at' => now()->subDay(),
        ]);

        $resultado = app(EmailVerificationService::class)->solicitar($usuario, forzar: true);

        $this->assertFalse($resultado);
        Mail::assertNothingSent();
    }

    public function test_confirmar_marca_correo_como_verificado(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $this->assertFalse($usuario->hasVerifiedEmail());

        $servicio = app(EmailVerificationService::class);
        $servicio->solicitar($usuario);

        Mail::assertSent(VerificarCorreoMail::class, function (VerificarCorreoMail $mail) {
            // Extraemos el token de la URL del correo enviado.
            $query = parse_url($mail->link, PHP_URL_QUERY);
            parse_str((string) $query, $params);

            $token = (string) $params['token'];
            $actualizado = app(EmailVerificationService::class)->confirmar($token);

            $this->assertTrue($actualizado->hasVerifiedEmail());
            $this->assertNotNull($actualizado->email_verified_at);

            return true;
        });
    }

    public function test_confirmar_es_idempotente_ante_segunda_llamada(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $servicio = app(EmailVerificationService::class);
        $servicio->solicitar($usuario);

        Mail::assertSent(VerificarCorreoMail::class, function (VerificarCorreoMail $mail) use ($servicio) {
            $query = parse_url($mail->link, PHP_URL_QUERY);
            parse_str((string) $query, $params);

            $token = (string) $params['token'];

            $primera = $servicio->confirmar($token);
            $this->assertTrue($primera->hasVerifiedEmail());

            // Segunda llamada: no debe explotar. La confirmacion sigue
            // funcionando aunque ya este verificado, simplemente no cambia
            // la fecha.
            $segunda = $servicio->confirmar($token);
            $this->assertTrue($segunda->hasVerifiedEmail());
            $this->assertEquals(
                $primera->email_verified_at?->toIso8601String(),
                $segunda->email_verified_at?->toIso8601String(),
            );

            return true;
        });
    }

    public function test_confirmar_falla_si_token_invalido(): void
    {
        $this->expectException(RuntimeException::class);

        app(EmailVerificationService::class)->confirmar('token-que-no-es-jwt');
    }

    public function test_confirmar_falla_si_correo_cambio_entre_envio_y_confirmacion(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'original@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $servicio = app(EmailVerificationService::class);
        $servicio->solicitar($usuario);

        Mail::assertSent(VerificarCorreoMail::class, function (VerificarCorreoMail $mail) use ($servicio, $usuario) {
            $query = parse_url($mail->link, PHP_URL_QUERY);
            parse_str((string) $query, $params);

            $token = (string) $params['token'];

            // Cambiamos el email del usuario entre el envio y el clic.
            $usuario->email = 'nuevo@example.com';
            $usuario->save();

            try {
                $servicio->confirmar($token);
                $this->fail('Esperaba excepcion por mismatch de correo.');
            } catch (RuntimeException $exception) {
                $this->assertStringContainsString('no corresponde', $exception->getMessage());
            }

            return true;
        });
    }

    public function test_confirmar_falla_si_cuenta_fue_eliminada(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $servicio = app(EmailVerificationService::class);
        $servicio->solicitar($usuario);

        Mail::assertSent(VerificarCorreoMail::class, function (VerificarCorreoMail $mail) use ($servicio, $usuario) {
            $query = parse_url($mail->link, PHP_URL_QUERY);
            parse_str((string) $query, $params);

            $token = (string) $params['token'];

            $usuario->delete();

            try {
                $servicio->confirmar($token);
                $this->fail('Esperaba excepcion porque la cuenta ya no existe.');
            } catch (RuntimeException $exception) {
                $this->assertStringContainsString('ya no existe', $exception->getMessage());
            }

            return true;
        });
    }
}
