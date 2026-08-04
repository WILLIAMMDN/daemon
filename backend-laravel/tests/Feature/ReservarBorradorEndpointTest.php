<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Services\Cuento\ActivosCuentoService;
use App\Services\Cuento\AsistenteCuentoService;
use App\Services\Cuento\CuentoService;
use App\Services\Cuento\CuentoV2Service;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservarBorradorEndpointTest extends TestCase
{
    /**
     * El POST /cuentos-v2/borradores debe despachar sin errores y responder
     * 201. Regresión: el controller usaba ReservarBorradorCuentoV2Request
     * sin importarlo, lo que lanzaba "Class not found" y producía un 500
     * genérico antes de tocar Firestore.
     */
    public function test_reservar_borrador_v2_201_cuando_el_servicio_responde(): void
    {
        $usuario = new Usuario(['id' => 1, 'rol' => 'alumno']);

        $this->mock(CuentoV2Service::class, function ($mock): void {
            $mock->shouldReceive('reservarBorrador')
                ->once()
                ->andReturn([
                    'cuento' => ['id' => 'abc123'],
                    'version' => ['id' => 'ver-1'],
                    'paginas' => [],
                ]);
        });
        $this->mock(CuentoService::class);
        $this->mock(AsistenteCuentoService::class);
        $this->mock(ActivosCuentoService::class);

        Sanctum::actingAs($usuario);

        $respuesta = $this->postJson('/api/v1/cuentos-v2/borradores', [
            'cuento_id' => 'abc123',
            'version_id' => 'ver-1',
        ]);

        $respuesta->assertStatus(201);
        $respuesta->assertJsonPath('cuento.id', 'abc123');
    }

    /**
     * Guardar un borrador vacío (título/categoría/páginas sin contenido)
     * es legítimo: "Guardar borrador" guarda progreso. Regresión: el
     * request exigía titulo/categoria/contenido y el editor mostraba
     * "No pudimos guardar el cuento" al guardar un cuento nuevo vacío.
     */
    public function test_guardar_borrador_v2_acepta_un_borrador_vacio(): void
    {
        $usuario = new Usuario(['id' => 1, 'rol' => 'alumno']);

        $this->mock(CuentoV2Service::class, function ($mock): void {
            $mock->shouldReceive('guardarBorrador')
                ->once()
                ->andReturn([
                    'cuento' => ['id' => 'abc123'],
                    'version' => ['id' => 'ver-1'],
                    'paginas' => [],
                ]);
        });
        $this->mock(CuentoService::class);
        $this->mock(AsistenteCuentoService::class);
        $this->mock(ActivosCuentoService::class);

        Sanctum::actingAs($usuario);

        $respuesta = $this->putJson('/api/v1/cuentos-v2/borradores/abc123', [
            'cuento_id' => 'abc123',
            'version_id' => 'ver-1',
            'titulo' => '',
            'sinopsis' => '',
            'categoria' => '',
            'rango_edad' => '',
            'portada_ref' => null,
            'revision_esperada' => 0,
            'paginas' => [[
                'id' => 'p1',
                'orden' => 1,
                'contenido' => '',
                'ilustracion_ref' => null,
                'texto_alternativo' => '',
                'fondo_token' => 'var(--daemon-surface)',
            ]],
        ]);

        $respuesta->assertStatus(200);
    }

    /**
     * El request class debe validar: faltan cuento_id/version_id -> 422.
     * También prueba que el route despacha hasta la capa de validación.
     */
    public function test_reservar_borrador_v2_valida_los_campos_requeridos(): void
    {
        $usuario = new Usuario(['id' => 1, 'rol' => 'alumno']);

        $this->mock(CuentoV2Service::class, function ($mock): void {
            $mock->shouldNotReceive('reservarBorrador');
        });
        $this->mock(CuentoService::class);
        $this->mock(AsistenteCuentoService::class);
        $this->mock(ActivosCuentoService::class);

        Sanctum::actingAs($usuario);

        $this->postJson('/api/v1/cuentos-v2/borradores', [])
            ->assertStatus(422);
    }
}
