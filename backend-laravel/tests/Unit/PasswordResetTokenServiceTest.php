<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\PasswordResetTokenService;
use Firebase\JWT\JWT;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class PasswordResetTokenServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.firebase.password_reset_url' => 'https://daemonestudiante.web.app/restablecer-clave',
            'app.key' => 'base64:'.base64_encode(str_repeat('a', 32)),
        ]);

        Schema::dropIfExists('usuarios');
        Schema::create('usuarios', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre_completo');
            $table->string('email')->nullable()->unique();
            $table->string('usuario')->unique();
            $table->string('password_hash');
            $table->string('firebase_uid')->nullable();
            $table->string('nivel')->default('TEENS');
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->boolean('perfil_completo')->default(true);
        });
    }

    public function test_crea_url_con_token_jwt_apuntando_al_frontend(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'firebase_uid' => 'firebase-uid-123',
            'nivel' => 'TEENS',
        ]);

        $url = (new PasswordResetTokenService())->crear($usuario);

        $this->assertStringStartsWith('https://daemonestudiante.web.app/restablecer-clave?', $url);
        $this->assertStringContainsString('correo=1', $url);
        $this->assertMatchesRegularExpression('/token=[A-Za-z0-9._-]+/', $url);
    }

    public function test_token_generado_es_verificable_y_devuelve_datos_del_usuario(): void
    {
        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'firebase_uid' => 'firebase-uid-456',
            'nivel' => 'TEENS',
        ]);

        $url = (new PasswordResetTokenService())->crear($usuario);
        $query = parse_url($url, PHP_URL_QUERY);
        parse_str((string) $query, $params);

        $payload = (new PasswordResetTokenService())->verificar((string) $params['token']);

        $this->assertSame('firebase-uid-456', $payload['uid']);
        $this->assertSame($usuario->id, $payload['uid_local']);
        $this->assertSame('alumno@example.com', $payload['email']);
    }

    public function test_token_falso_es_rechazado(): void
    {
        $this->expectException(RuntimeException::class);

        (new PasswordResetTokenService())->verificar('token-que-no-es-jwt');
    }

    public function test_token_de_otra_finalidad_es_rechazado(): void
    {
        $clave = base64_decode(substr((string) config('app.key'), 7));
        $token = JWT::encode([
            'sub' => 'otro_proposito',
            'uid' => 'fake',
            'email' => 'fake@example.com',
            'exp' => time() + 3600,
        ], $clave, 'HS256');

        $this->expectException(RuntimeException::class);

        (new PasswordResetTokenService())->verificar($token);
    }
}