<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\EventoProducto;
use App\Models\Institucion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SafetyAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_alumno_reporta_bloquea_y_telemetria_descarta_propiedades_no_permitidas(): void
    {
        $institucion = Institucion::create(['nombre' => 'Seguridad', 'slug' => 'seguridad']);
        $aula = Aula::create(['id_institucion' => $institucion->id, 'nombre' => 'Aula segura']);
        $alumno = $this->usuario('Alumno Uno', 'alumno.uno', $institucion, $aula);
        $otro = $this->usuario('Alumno Dos', 'alumno.dos', $institucion, $aula);

        $this->actingAs($alumno)->postJson('/api/v1/comunidad/reportes', [
            'id_usuario_reportado' => $otro->id,
            'tipo_contenido' => 'usuario',
            'categoria' => 'acoso',
            'descripcion' => 'Necesito ayuda con este perfil.',
        ])->assertCreated()->assertJsonPath('severidad', 'high');

        $this->actingAs($alumno)->postJson("/api/v1/comunidad/bloqueos/{$otro->id}")->assertNoContent();
        $this->actingAs($alumno)->getJson('/api/v1/comunidad')->assertOk()->assertJsonMissing(['id' => $otro->id]);

        $this->actingAs($alumno)->postJson('/api/v1/telemetria/eventos', [
            'nombre' => 'module_opened',
            'sesion_id' => 'sesion-opaca',
            'propiedades' => ['module' => 'misiones', 'mensaje' => 'texto que no debe almacenarse'],
        ])->assertNoContent()->assertHeader('X-Request-ID');

        $evento = EventoProducto::firstOrFail();
        $this->assertSame(['module' => 'misiones'], $evento->propiedades);
        $this->assertNotSame('sesion-opaca', $evento->sesion_hash);
    }

    private function usuario(string $nombre, string $username, Institucion $institucion, Aula $aula): Usuario
    {
        return Usuario::create([
            'nombre_completo' => $nombre, 'usuario' => $username, 'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno', 'nivel' => 'KIDS', 'id_institucion' => $institucion->id, 'id_aula' => $aula->id,
        ]);
    }
}
