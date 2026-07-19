<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\AutenticacionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
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
            $table->string('nombre_completo')->nullable();
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('telefono', 30)->nullable()->unique();
            $table->string('usuario')->nullable()->unique();
            $table->string('password_hash');
            $table->string('nivel')->nullable();
            $table->boolean('perfil_completo')->default(false);
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->string('avatar')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('firebase_uid', 128)->nullable()->unique();
        });
    }

    public function test_perfil_incompleto_puede_logear_para_completar_bienvenida(): void
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

        $usuario = $service->autenticarConFirebase(
            $this->claims(['uid' => 'firebase-pending', 'email' => 'pendiente-firebase@example.com']),
            false,
        );

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

    public function test_login_permite_email_no_verificado_y_mantiene_banner_pendiente(): void
    {
        $service = app(AutenticacionService::class);

        Usuario::create([
            'nombre_completo' => 'Sin verificar',
            'email' => 'sospechoso@example.com',
            'usuario' => 'sospechoso',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'firebase_uid' => 'firebase-no-verificado',
        ]);

        $usuario = $service->autenticarConFirebase(
            $this->claims([
                'uid' => 'firebase-no-verificado',
                'email' => 'sospechoso@example.com',
                'email_verified' => false,
            ]),
            false,
        );

        $this->assertNotNull($usuario);
        $this->assertNull($usuario->email_verified_at);
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
        $this->assertNull($usuario->nombre_completo);
        $this->assertNull($usuario->email);
        $this->assertNull($usuario->usuario);
    }

    public function test_vincula_firebase_a_cuenta_legacy_solo_con_clave_valida(): void
    {
        $legacy = Usuario::create([
            'nombre_completo' => 'Alumno Legacy',
            'email' => null,
            'usuario' => 'legacy123',
            'password_hash' => Hash::make('clave-segura'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
        ]);

        $usuario = app(AutenticacionService::class)->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-legacy',
            'email' => 'legacy@example.com',
            'email_verified' => true,
            'google_id' => 'google-legacy',
            'provider' => 'google.com',
        ], [
            'usuario' => 'legacy123',
            'password' => 'clave-segura',
        ]);

        $this->assertSame($legacy->id, $usuario->id);
        $this->assertSame('firebase-legacy', $usuario->firebase_uid);
        $this->assertSame('google-legacy', $usuario->google_id);
        $this->assertSame('legacy@example.com', $usuario->email);
        $this->assertNotNull($usuario->email_verified_at);
    }

    public function test_vinculacion_reemplaza_placeholder_incompleto_sin_perder_cuenta_legacy(): void
    {
        $legacy = Usuario::create([
            'nombre_completo' => 'Alumno con progreso',
            'email' => null,
            'usuario' => 'progreso123',
            'password_hash' => Hash::make('clave-segura'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 540,
        ]);
        $placeholder = Usuario::create([
            'nombre_completo' => 'Google temporal',
            'email' => 'google@example.com',
            'usuario' => null,
            'password_hash' => Hash::make('aleatoria'),
            'nivel' => null,
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'firebase_uid' => 'firebase-placeholder',
            'google_id' => 'google-placeholder',
        ]);

        $usuario = app(AutenticacionService::class)->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-placeholder',
            'email' => 'google@example.com',
            'email_verified' => true,
            'google_id' => 'google-placeholder',
            'provider' => 'google.com',
        ], [
            'usuario' => 'progreso123',
            'password' => 'clave-segura',
        ]);

        $this->assertSame($legacy->id, $usuario->id);
        $this->assertSame(540, $usuario->tokens);
        $this->assertDatabaseMissing('usuarios', ['id' => $placeholder->id]);
        $this->assertSame('firebase-placeholder', $usuario->firebase_uid);
    }

    public function test_vinculacion_rechaza_clave_incorrecta(): void
    {
        Usuario::create([
            'nombre_completo' => 'Legacy protegido',
            'email' => null,
            'usuario' => 'protegido123',
            'password_hash' => Hash::make('clave-correcta'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
        ]);

        $service = app(AutenticacionService::class);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Usuario o contrasena incorrectos.');

        $service->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-protegido',
            'email' => 'protegido@example.com',
            'google_id' => 'google-protegido',
            'provider' => 'google.com',
        ], [
            'usuario' => 'protegido123',
            'password' => 'incorrecta',
        ]);
    }

    public function test_vinculacion_no_absorbe_otra_cuenta_google_activa(): void
    {
        Usuario::create([
            'nombre_completo' => 'Legacy protegido',
            'email' => null,
            'usuario' => 'legacy-activo',
            'password_hash' => Hash::make('clave-correcta'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
        ]);
        Usuario::create([
            'nombre_completo' => 'Google activo',
            'email' => 'activo@example.com',
            'usuario' => 'google-activo',
            'password_hash' => Hash::make('otra-clave'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'firebase_uid' => 'firebase-activo',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Este Google ya esta vinculado a otra cuenta DAEMON.');

        app(AutenticacionService::class)->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-activo',
            'email' => 'activo@example.com',
            'google_id' => 'google-activo',
            'provider' => 'google.com',
        ], [
            'usuario' => 'legacy-activo',
            'password' => 'clave-correcta',
        ]);
    }

    public function test_vinculacion_rechaza_una_identidad_que_no_sea_google(): void
    {
        Usuario::create([
            'nombre_completo' => 'Legacy protegido',
            'email' => null,
            'usuario' => 'legacy-email',
            'password_hash' => Hash::make('clave-correcta'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('La vinculacion requiere una identidad de Google valida.');

        app(AutenticacionService::class)->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-email',
            'email' => 'email@example.com',
            'provider' => 'password',
        ], [
            'usuario' => 'legacy-email',
            'password' => 'clave-correcta',
        ]);
    }

    public function test_vinculacion_no_reemplaza_otro_google_de_la_cuenta_legacy(): void
    {
        Usuario::create([
            'nombre_completo' => 'Legacy ya vinculado',
            'email' => null,
            'usuario' => 'legacy-vinculado',
            'password_hash' => Hash::make('clave-correcta'),
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'google_id' => 'google-anterior',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('La cuenta DAEMON ya esta vinculada a otro Google.');

        app(AutenticacionService::class)->vincularCuentaLegacyFirebase([
            'uid' => 'firebase-nuevo',
            'email' => 'nuevo@example.com',
            'google_id' => 'google-nuevo',
            'provider' => 'google.com',
        ], [
            'usuario' => 'legacy-vinculado',
            'password' => 'clave-correcta',
        ]);
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
