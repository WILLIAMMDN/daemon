<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\AutenticacionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleAuthFlowTest extends TestCase
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
            $table->string('usuario')->unique();
            $table->string('password_hash');
            $table->string('nivel')->default('TEENS');
            $table->boolean('perfil_completo')->default(true);
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->string('avatar')->nullable();
            $table->string('google_id')->nullable()->unique();
        });
    }

    public function test_incomplete_google_profile_cannot_be_completed_from_login(): void
    {
        Usuario::create([
            'nombre_completo' => 'Pendiente',
            'email' => 'pendiente@example.com',
            'usuario' => 'pendiente',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => null,
            'google_id' => 'google-pending',
        ]);

        $service = app(AutenticacionService::class);
        $googleUser = SocialiteUser::fake([
            'id' => 'google-pending',
            'email' => 'pendiente@example.com',
            'name' => 'Pendiente Google',
        ]);

        $this->assertNull($service->autenticarConGoogle($googleUser, false));

        $usuario = $service->autenticarConGoogle($googleUser, true);

        $this->assertNotNull($usuario);
        $this->assertFalse($usuario->perfil_completo);
        $this->assertSame('pendiente@example.com', $usuario->email);
    }

    public function test_complete_google_profile_can_login_without_registration_mode(): void
    {
        Usuario::create([
            'nombre_completo' => 'Cuenta Activa',
            'email' => 'activa@example.com',
            'usuario' => 'activa',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => null,
            'google_id' => 'google-active',
        ]);

        $service = app(AutenticacionService::class);
        $googleUser = SocialiteUser::fake([
            'id' => 'google-active',
            'email' => 'activa@example.com',
            'name' => 'Cuenta Activa',
        ]);

        $usuario = $service->autenticarConGoogle($googleUser, false);

        $this->assertNotNull($usuario);
        $this->assertTrue($usuario->perfil_completo);
        $this->assertSame('activa', $usuario->usuario);
    }
}
