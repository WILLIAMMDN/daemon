<?php

namespace Tests\Unit;

use App\Mail\RecuperarClaveMail;
use App\Models\Usuario;
use App\Services\Auth\FirebasePasswordResetLinkService;
use App\Services\Auth\RecuperacionClaveService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class RecuperacionClaveServiceTest extends TestCase
{
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
            $table->string('rol')->default('alumno');
            $table->integer('tokens')->default(0);
            $table->boolean('perfil_completo')->default(true);
        });
    }

    public function test_envia_correo_con_link_firebase_a_cuenta_existente(): void
    {
        Mail::fake();

        Usuario::create([
            'nombre_completo' => 'Alumno DAEMON',
            'email' => 'alumno@example.com',
            'usuario' => 'alumno',
            'password_hash' => 'irrelevant',
            'nivel' => 'TEENS',
        ]);

        $firebase = Mockery::mock(FirebasePasswordResetLinkService::class);
        $firebase->shouldReceive('crear')
            ->once()
            ->with('alumno@example.com')
            ->andReturn('https://daemonestudiante.web.app/restablecer-clave?mode=resetPassword&oobCode=CODIGO');

        (new RecuperacionClaveService($firebase))->solicitar(['email' => 'alumno@example.com']);

        Mail::assertSent(RecuperarClaveMail::class, function (RecuperarClaveMail $mail): bool {
            return $mail->hasTo('alumno@example.com')
                && str_contains($mail->link, 'oobCode=CODIGO');
        });
    }

    public function test_no_filtra_si_el_correo_no_existe(): void
    {
        Mail::fake();

        $firebase = Mockery::mock(FirebasePasswordResetLinkService::class);
        $firebase->shouldNotReceive('crear');

        (new RecuperacionClaveService($firebase))->solicitar(['email' => 'nadie@example.com']);

        Mail::assertNothingSent();
    }
}
