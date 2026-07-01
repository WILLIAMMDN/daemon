<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Academico\AcademicScopeService;
use App\Services\Docente\DocenteService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class AcademicScopeServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('aulas');
        Schema::dropIfExists('instituciones');

        Schema::create('instituciones', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('aulas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->nullable();
            $table->string('nombre');
            $table->string('nivel')->nullable();
            $table->string('codigo')->nullable();
            $table->timestamps();
        });

        Schema::create('usuarios', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre_completo');
            $table->string('email')->nullable();
            $table->string('usuario')->unique();
            $table->string('password_hash');
            $table->string('nivel')->default('TEENS');
            $table->integer('tokens')->default(0);
            $table->integer('pro_tokens')->default(0);
            $table->integer('mision_actual')->default(1);
            $table->string('rango')->default('Novato');
            $table->string('rol')->default('alumno');
            $table->foreignId('id_institucion')->nullable();
            $table->foreignId('id_aula')->nullable();
            $table->boolean('perfil_completo')->default(true);
            $table->timestamp('fecha_registro')->nullable();
            $table->timestamp('email_verified_at')->nullable();
        });
    }

    public function test_docente_solo_lista_alumnos_de_su_aula(): void
    {
        [$aulaUno, $aulaDos] = $this->crearAulas();
        $docente = $this->usuario('Docente', 'docente', $aulaUno, 0, 'docente');
        $alumnoAula = $this->usuario('Alumno aula', 'alumno-aula', $aulaUno, 80);
        $this->usuario('Alumno externo', 'alumno-externo', $aulaDos, 200);

        $alumnos = app(DocenteService::class)->alumnos($docente);

        $this->assertCount(1, $alumnos);
        $this->assertSame($alumnoAula->id, $alumnos->first()->id);
    }

    public function test_docente_sin_aula_no_lista_alumnos(): void
    {
        [$aulaUno] = $this->crearAulas();
        $docente = $this->usuario('Docente sin aula', 'docente-sin-aula', null, 0, 'docente');
        $this->usuario('Alumno aula', 'alumno-aula', $aulaUno, 80);

        $alumnos = app(DocenteService::class)->alumnos($docente);

        $this->assertCount(0, $alumnos);
    }

    public function test_docente_no_puede_gestionar_alumno_de_otra_aula(): void
    {
        [$aulaUno, $aulaDos] = $this->crearAulas();
        $docente = $this->usuario('Docente', 'docente', $aulaUno, 0, 'docente');
        $alumnoExterno = $this->usuario('Alumno externo', 'alumno-externo', $aulaDos);

        $this->expectException(HttpException::class);

        app(AcademicScopeService::class)->alumnoGestionable($docente, $alumnoExterno->id);
    }

    public function test_admin_lista_alumnos_de_todas_las_aulas(): void
    {
        [$aulaUno, $aulaDos] = $this->crearAulas();
        $admin = $this->usuario('Admin', 'admin', null, 0, 'admin');
        $this->usuario('Alumno uno', 'alumno-uno', $aulaUno);
        $this->usuario('Alumno dos', 'alumno-dos', $aulaDos);

        $alumnos = app(DocenteService::class)->alumnos($admin);

        $this->assertCount(2, $alumnos);
    }

    private function crearAulas(): array
    {
        $institucion = \App\Models\Institucion::create(['nombre' => 'DAEMON', 'slug' => 'daemon']);

        return [
            \App\Models\Aula::create(['id_institucion' => $institucion->id, 'nombre' => 'Aula A', 'nivel' => 'TEENS', 'codigo' => 'A']),
            \App\Models\Aula::create(['id_institucion' => $institucion->id, 'nombre' => 'Aula B', 'nivel' => 'TEENS', 'codigo' => 'B']),
        ];
    }

    private function usuario(string $nombre, string $usuario, ?\App\Models\Aula $aula, int $tokens = 0, string $rol = 'alumno'): Usuario
    {
        return Usuario::create([
            'nombre_completo' => $nombre,
            'usuario' => $usuario,
            'password_hash' => bcrypt('secret'),
            'nivel' => $rol === 'docente' ? 'DOCENTE' : 'TEENS',
            'tokens' => $tokens,
            'rol' => $rol,
            'id_institucion' => $aula?->id_institucion,
            'id_aula' => $aula?->id,
        ]);
    }
}
