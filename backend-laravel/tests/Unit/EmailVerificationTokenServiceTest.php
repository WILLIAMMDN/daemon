<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\EmailVerificationTokenService;
use Firebase\JWT\JWT;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class EmailVerificationTokenServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('a', 32)),
        ]);

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

    public function test_crea_url_con_token_apuntando_al_frontend_de_verificacion(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        // El env var FRONTEND_EMAIL_VERIFICATION_URL es la primera opcion
        // que mira el servicio, asi lo usamos para evitar el fallback
        // http://localhost:4200 que viene por defecto en testing.
        $this->app['config']->set('app.url', 'https://daemonestudiante.web.app');
        putenv('FRONTEND_EMAIL_VERIFICATION_URL=https://daemonestudiante.web.app/verificar-correo');

        $url = (new EmailVerificationTokenService())->crear($usuario);

        $this->assertStringStartsWith('https://daemonestudiante.web.app/verificar-correo?', $url);
        $this->assertMatchesRegularExpression('/token=[A-Za-z0-9._-]+/', $url);
    }

    public function test_crear_falla_si_usuario_sin_email(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => null,
            'usuario' => 'sinmail',
            'password_hash' => 'irrelevant',
        ]);

        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->crear($usuario);
    }

    public function test_token_generado_es_verificable_y_devuelve_datos_del_usuario(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
        ]);

        $url = (new EmailVerificationTokenService())->crear($usuario);
        $query = parse_url($url, PHP_URL_QUERY);
        parse_str((string) $query, $params);

        $payload = (new EmailVerificationTokenService())->verificar((string) $params['token']);

        $this->assertSame($usuario->id, $payload['uid_local']);
        $this->assertSame('alumno@example.com', $payload['email']);
    }

    public function test_token_falso_es_rechazado(): void
    {
        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->verificar('token-que-no-es-jwt');
    }

    public function test_token_vacio_es_rechazado(): void
    {
        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->verificar('   ');
    }

    public function test_token_de_otra_finalidad_es_rechazado(): void
    {
        $clave = base64_decode(substr((string) config('app.key'), 7));
        $token = JWT::encode([
            'sub' => 'recuperar_clave',
            'uid_local' => 1,
            'email' => 'fake@example.com',
            'exp' => time() + 3600,
        ], $clave, 'HS256');

        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->verificar($token);
    }

    public function test_token_expirado_es_rechazado(): void
    {
        $clave = base64_decode(substr((string) config('app.key'), 7));
        $token = JWT::encode([
            'sub' => 'verificar_correo',
            'uid_local' => 1,
            'email' => 'fake@example.com',
            'iat' => time() - 7200,
            'exp' => time() - 3600,
        ], $clave, 'HS256');

        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->verificar($token);
    }

    public function test_token_sin_email_o_uid_es_rechazado(): void
    {
        $clave = base64_decode(substr((string) config('app.key'), 7));
        $token = JWT::encode([
            'sub' => 'verificar_correo',
            'exp' => time() + 3600,
        ], $clave, 'HS256');

        $this->expectException(RuntimeException::class);

        (new EmailVerificationTokenService())->verificar($token);
    }
}