<?php

namespace Tests\Unit;

use App\Mail\RecuperarClaveMail;
use App\Models\Usuario;
use App\Services\Auth\FirebaseAdminService;
use App\Services\Auth\GoogleServiceAccountTokenService;
use App\Services\Auth\PasswordResetTokenService;
use App\Services\Auth\RecuperacionClaveService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class RecuperacionClaveServiceTest extends TestCase
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

    public function test_solicitar_envia_correo_con_link_de_recuperacion(): void
    {
        Mail::fake();

        Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'firebase_uid' => 'firebase-uid-1',
            'nivel' => 'TEENS',
        ]);

        $tokens = Mockery::mock(PasswordResetTokenService::class);
        $tokens->shouldReceive('crear')
            ->once()
            ->andReturn('https://daemonestudiante.web.app/restablecer-clave?token=FAKE');

        $admin = Mockery::mock(FirebaseAdminService::class);

        (new RecuperacionClaveService($tokens, $admin))->solicitar(['email' => 'alumno@example.com']);

        Mail::assertSent(RecuperarClaveMail::class, function (RecuperarClaveMail $mail): bool {
            return $mail->hasTo('alumno@example.com')
                && $mail->link === 'https://daemonestudiante.web.app/restablecer-clave?token=FAKE';
        });
    }

    public function test_solicitar_no_hace_nada_si_el_correo_no_existe(): void
    {
        Mail::fake();

        $tokens = Mockery::mock(PasswordResetTokenService::class);
        $tokens->shouldNotReceive('crear');
        $admin = Mockery::mock(FirebaseAdminService::class);

        (new RecuperacionClaveService($tokens, $admin))->solicitar(['email' => 'nadie@example.com']);

        Mail::assertNothingSent();
    }

    public function test_confirmar_actualiza_firebase_y_hash_local(): void
    {
        config(['services.firebase.project_id' => 'daemon-a41f8']);

        $usuario = Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'viejo-hash',
            'firebase_uid' => 'firebase-uid-1',
            'nivel' => 'TEENS',
        ]);

        $tokens = new PasswordResetTokenService();
        $url = $tokens->crear($usuario);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $params);

        Http::fake([
            'identitytoolkit.googleapis.com/*' => Http::response(['localId' => 'firebase-uid-1'], 200),
        ]);

        $admin = new FirebaseAdminService(
            Mockery::mock(GoogleServiceAccountTokenService::class)
                ->shouldReceive('token')->andReturn('google-access-token')
                ->getMock(),
        );

        $servicio = new RecuperacionClaveService($tokens, $admin);
        $actualizado = $servicio->confirmar((string) $params['token'], 'nueva-clave-123');

        $this->assertTrue(Hash::check('nueva-clave-123', $actualizado->password_hash));
        Http::assertSent(fn ($request) => $request->url() === 'https://identitytoolkit.googleapis.com/v1/projects/daemon-a41f8/accounts:update'
            && ($request['localId'] ?? null) === 'firebase-uid-1'
            && ($request['password'] ?? null) === 'nueva-clave-123');
    }

    public function test_confirmar_falla_si_el_token_es_invalido(): void
    {
        $tokens = new PasswordResetTokenService();
        $admin = Mockery::mock(FirebaseAdminService::class);
        $admin->shouldNotReceive('updatePassword');

        $servicio = new RecuperacionClaveService($tokens, $admin);

        $this->expectException(RuntimeException::class);

        $servicio->confirmar('token-malo', 'nueva-clave-123');
    }
}