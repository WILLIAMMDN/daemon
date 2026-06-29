<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\AutenticacionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use Tests\TestCase;

class FirebaseAuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('usuarios');
        Schema::create('usuarios', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre_completo');
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('telefono', 30)->nullable()->unique();
            $table->string('usuario')->unique();
            $table->string('password_hash');
            $table->string('nivel')->default('TEENS');
            $table->boolean('perfil_completo')->default(true);
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->string('avatar')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('firebase_uid', 128)->nullable()->unique();
        });
    }

    public function test_perfil_incompleto_no_puede_logear_sin_crear_cuenta(): void
    {
        Usuario::create([
            'nombre_completo' => 'Pendiente Firebase',
            'email' => 'pendiente-firebase@example.com',
            'usuario' => 'pendiente-firebase',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'firebase_uid' => 'firebase-pending',
        ]);

        $service = app(AutenticacionService::class);

        $this->assertNull($service->autenticarConFirebase(
            $this->claims(['uid' => 'firebase-pending', 'email' => 'pendiente-firebase@example.com']),
            false,
        ));

        $usuario = $service->autenticarConFirebase(
            $this->claims(['uid' => 'firebase-pending', 'email' => 'pendiente-firebase@example.com']),
            true,
        );

        $this->assertNotNull($usuario);
        $this->assertFalse($usuario->perfil_completo);
        $this->assertSame('pendiente-firebase@example.com', $usuario->email);
    }

    public function test_perfil_completo_puede_logear_sin_crear_cuenta(): void
    {
        Usuario::create([
            'nombre_completo' => 'Cuenta Activa Firebase',
            'email' => 'activa-firebase@example.com',
            'usuario' => 'activa-firebase',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'firebase_uid' => 'firebase-active',
        ]);

        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            $this->claims(['uid' => 'firebase-active', 'email' => 'activa-firebase@example.com']),
            false,
        );

        $this->assertNotNull($usuario);
        $this->assertTrue($usuario->perfil_completo);
        $this->assertSame('activa-firebase', $usuario->usuario);
    }

    public function test_enlaza_usuario_existente_por_email_y_rellena_firebase_uid(): void
    {
        Usuario::create([
            'nombre_completo' => 'Sin Firebase',
            'email' => 'migrar@example.com',
            'usuario' => 'migrar',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
        ]);

        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-nuevo',
                'email' => 'migrar@example.com',
                'name' => 'Migrar Firebase',
                'picture' => 'https://example.com/nuevo.png',
            ]),
            false,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('firebase-nuevo', $usuario->firebase_uid);
        $this->assertSame('https://example.com/nuevo.png', $usuario->avatar);
    }

    public function test_rellena_campos_vacios_sin_sobrescribir_los_existentes(): void
    {
        Usuario::create([
            'nombre_completo' => 'Nombre Fijo',
            'email' => 'fijo@example.com',
            'usuario' => 'fijo',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => 'https://example.com/original.png',
            'google_id' => 'google-fijo',
        ]);

        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-fijo',
                'email' => 'fijo@example.com',
                'name' => 'Nuevo Nombre',
                'picture' => 'https://example.com/nuevo.png',
                'google_id' => 'google-nuevo',
            ]),
            false,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('Nombre Fijo', $usuario->nombre_completo);
        $this->assertSame('https://example.com/original.png', $usuario->avatar);
        $this->assertSame('google-fijo', $usuario->google_id);
    }

    public function test_crea_usuario_nuevo_cuando_crear_cuenta_es_true_y_no_hay_match(): void
    {
        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-brand-new',
                'email' => 'nuevo@example.com',
                'name' => 'Nuevo Firebase',
            ]),
            true,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('firebase-brand-new', $usuario->fresh()->firebase_uid);
        $this->assertSame('nuevo@example.com', $usuario->email);
        $this->assertSame('Nuevo Firebase', $usuario->nombre_completo);
        $this->assertFalse($usuario->perfil_completo);
    }

    public function test_devuelve_null_cuando_no_hay_match_y_crear_cuenta_es_false(): void
    {
        $service = app(AutenticacionService::class);

        $this->assertNull($service->autenticarConFirebase(
            $this->claims(['uid' => 'firebase-inexistente', 'email' => 'no@example.com']),
            false,
        ));

        $this->assertSame(0, Usuario::count());
    }

    public function test_rechaza_email_no_verificado_en_login(): void
    {
        $service = app(AutenticacionService::class);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Firebase no confirmo el correo de la cuenta.');

        $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-no-verificado',
                'email' => 'sospechoso@example.com',
                'email_verified' => false,
            ]),
            false,
        );
    }

    public function test_registro_permite_email_no_verificado_para_no_bloquear_alta(): void
    {
        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-fresco',
                'email' => 'fresco@example.com',
                'name' => 'Recién Llegado',
                'email_verified' => false,
            ]),
            true,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('fresco@example.com', $usuario->email);
        // El email queda como NO verificado: el usuario lo confirmara
        // despues desde el enlace que le envia el flujo de
        // EmailVerificationService.
        $this->assertNull($usuario->email_verified_at);
    }

    public function test_login_solo_por_telefono_no_pasa_por_chequeo_de_email_verificado(): void
    {
        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            [
                'uid' => 'firebase-phone',
                'phone_number' => '+51999888777',
            ],
            true,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('+51999888777', $usuario->telefono);
        $this->assertNull($usuario->email);
    }

    public function test_crea_usuario_con_datos_basicos_cuando_token_no_lleva_email(): void
    {
        $service = app(AutenticacionService::class);

        $usuario = $service->autenticarConFirebase(
            ['uid' => 'firebase-anonimo'],
            true,
        );

        $this->assertNotNull($usuario);
        $this->assertSame('Usuario Firebase', $usuario->nombre_completo);
        $this->assertNull($usuario->email);
        $this->assertStringStartsWith('firebase', $usuario->usuario);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function claims(array $overrides = []): array
    {
        return array_merge([
            'uid' => 'firebase-default',
            'email' => 'default@example.com',
            'email_verified' => true,
        ], $overrides);
    }
}