<?php

namespace Tests\Feature;

use App\Models\CosmeticoMascota;
use App\Models\EquipamientoMascota;
use App\Models\EspecieMascota;
use App\Models\InventarioMascota;
use App\Models\Premio;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MascotaGamificacionTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_la_criatura_inicial_y_entrega_un_render_por_capas(): void
    {
        $alumno = $this->alumno();

        $this->actingAs($alumno)->getJson('/api/v1/mascota')
            ->assertOk()
            ->assertJsonPath('mascota.nombre', 'Nexo')
            ->assertJsonPath('mascota.especie.codigo', 'daemon-origen')
            ->assertJsonPath('mascota.capas.0.tipo', 'base')
            ->assertJsonPath('resumen.poseidos', 0);

        $this->assertDatabaseHas('mascotas_alumnos', ['id_alumno' => $alumno->id]);
    }

    public function test_canje_cosmetico_es_atomico_y_no_permite_comprarlo_dos_veces(): void
    {
        $alumno = $this->alumno(tokens: 100, experiencia: 500);
        [$premio, $cosmetico] = $this->cosmetico('gorro-azul', 'cabeza', 25);

        $this->actingAs($alumno)->postJson("/api/v1/tienda/canjear/{$premio->id}")
            ->assertOk()
            ->assertJsonPath('saldo', 75)
            ->assertJsonPath('cosmetico.id', $cosmetico->id);

        $this->assertDatabaseHas('mascota_inventario', [
            'id_alumno' => $alumno->id,
            'id_cosmetico' => $cosmetico->id,
            'fuente' => 'tienda',
        ]);
        $this->assertDatabaseHas('premios', ['id' => $premio->id, 'stock' => 4]);

        $this->actingAs($alumno)->postJson("/api/v1/tienda/canjear/{$premio->id}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Este accesorio ya pertenece a tu inventario.');

        $alumno->refresh();
        $this->assertSame(75, $alumno->tokens);
        $this->assertSame(500, $alumno->experiencia);
        $this->assertSame(1, InventarioMascota::where('id_alumno', $alumno->id)->count());
        $this->assertSame(4, $premio->fresh()->stock);
    }

    public function test_solo_equipa_items_poseidos_compatibles_y_reemplaza_la_misma_ranura(): void
    {
        $alumno = $this->alumno();
        [, $primero] = $this->cosmetico('gorro-uno', 'cabeza');
        [, $segundo] = $this->cosmetico('gorro-dos', 'cabeza');

        $this->actingAs($alumno)->postJson('/api/v1/mascota/equipar', ['id_cosmetico' => $primero->id])
            ->assertUnprocessable();

        InventarioMascota::create(['id_alumno' => $alumno->id, 'id_cosmetico' => $primero->id, 'fuente' => 'regalo']);
        InventarioMascota::create(['id_alumno' => $alumno->id, 'id_cosmetico' => $segundo->id, 'fuente' => 'regalo']);

        $this->actingAs($alumno)->postJson('/api/v1/mascota/equipar', ['id_cosmetico' => $primero->id])
            ->assertOk()
            ->assertJsonPath('mascota.capas.1.id', $primero->id);
        $this->actingAs($alumno)->postJson('/api/v1/mascota/equipar', ['id_cosmetico' => $segundo->id])
            ->assertOk()
            ->assertJsonPath('mascota.capas.1.id', $segundo->id);

        $this->assertSame(1, EquipamientoMascota::count());
        $this->assertDatabaseHas('mascota_equipamientos', ['id_cosmetico' => $segundo->id, 'slot' => 'cabeza']);
    }

    public function test_cambiar_especie_retira_capas_incompatibles(): void
    {
        $alumno = $this->alumno();
        [, $cosmetico] = $this->cosmetico('aura-origen', 'aura');
        InventarioMascota::create(['id_alumno' => $alumno->id, 'id_cosmetico' => $cosmetico->id, 'fuente' => 'regalo']);
        $this->actingAs($alumno)->getJson('/api/v1/mascota')->assertOk();
        $this->actingAs($alumno)->postJson('/api/v1/mascota/equipar', ['id_cosmetico' => $cosmetico->id])->assertOk();

        $otra = EspecieMascota::create([
            'codigo' => 'daemon-luna',
            'nombre' => 'Luna',
            'asset_base' => 'img/mascotas/luna/base.webp',
            'lienzo_ancho' => 1024,
            'lienzo_alto' => 1024,
            'orden' => 20,
            'activo' => true,
        ]);

        $this->actingAs($alumno)->patchJson('/api/v1/mascota', ['id_especie' => $otra->id])
            ->assertOk()
            ->assertJsonPath('mascota.especie.codigo', 'daemon-luna')
            ->assertJsonPath('cosmeticos.0.poseido', true)
            ->assertJsonPath('cosmeticos.0.compatible', false)
            ->assertJsonCount(1, 'mascota.capas');

        $this->assertDatabaseCount('mascota_equipamientos', 0);
    }

    public function test_crear_premio_cosmetico_registra_catalogo_y_compatibilidad(): void
    {
        $admin = Usuario::create([
            'nombre_completo' => 'Admin Mascotas',
            'usuario' => 'admin.mascotas',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'admin',
            'nivel' => 'TEENS',
        ]);
        $especie = EspecieMascota::firstOrFail();

        $respuesta = $this->actingAs($admin)->postJson('/api/v1/tienda/premios', [
            'nombre' => 'Visor estelar',
            'descripcion' => 'Accesorio visual.',
            'precio' => 40,
            'stock' => 100,
            'categoria' => 'GENERAL',
            'tipo_entrega' => 'cosmetico',
            'cosmetico' => [
                'codigo' => 'visor-estelar',
                'slot' => 'ojos',
                'rareza' => 'epico',
                'asset_capa' => 'img/mascotas/daemon-origen/ojos/visor-estelar.webp',
                'orden_capa' => 30,
                'especies' => [$especie->id],
            ],
        ])->assertCreated();

        $premioId = $respuesta->json('id');
        $this->assertDatabaseHas('mascota_cosmeticos', ['id_premio' => $premioId, 'codigo' => 'visor-estelar']);
        $cosmetico = CosmeticoMascota::where('id_premio', $premioId)->firstOrFail();
        $this->assertDatabaseHas('mascota_compatibilidades', ['id_cosmetico' => $cosmetico->id, 'id_especie' => $especie->id]);

        $this->actingAs($admin)->putJson("/api/v1/tienda/premios/{$premioId}", [
            'cosmetico' => ['activo' => false],
        ])->assertOk();
        $this->assertDatabaseHas('mascota_compatibilidades', ['id_cosmetico' => $cosmetico->id, 'id_especie' => $especie->id]);
    }

    public function test_actualizar_compatibilidad_retira_equipamiento_pero_conserva_inventario(): void
    {
        $admin = Usuario::create([
            'nombre_completo' => 'Admin Catalogo',
            'usuario' => 'admin.catalogo',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'admin',
            'nivel' => 'TEENS',
        ]);
        $alumno = $this->alumno();
        [$premio, $cosmetico] = $this->cosmetico('casco-mutable', 'cabeza');
        $otra = EspecieMascota::create([
            'codigo' => 'daemon-sol',
            'nombre' => 'Sol',
            'asset_base' => 'img/mascotas/daemon-sol/base.webp',
            'lienzo_ancho' => 1024,
            'lienzo_alto' => 1024,
            'orden' => 20,
            'activo' => true,
        ]);
        InventarioMascota::create(['id_alumno' => $alumno->id, 'id_cosmetico' => $cosmetico->id, 'fuente' => 'regalo']);
        $this->actingAs($alumno)->getJson('/api/v1/mascota')->assertOk();
        $this->actingAs($alumno)->postJson('/api/v1/mascota/equipar', ['id_cosmetico' => $cosmetico->id])->assertOk();

        $this->actingAs($admin)->putJson("/api/v1/tienda/premios/{$premio->id}", [
            'tipo_entrega' => 'cosmetico',
            'cosmetico' => [
                'codigo' => $cosmetico->codigo,
                'slot' => $cosmetico->slot,
                'rareza' => $cosmetico->rareza,
                'asset_capa' => $cosmetico->asset_capa,
                'orden_capa' => $cosmetico->orden_capa,
                'activo' => false,
                'especies' => [$otra->id],
            ],
        ])->assertOk();

        $this->assertDatabaseCount('mascota_equipamientos', 0);
        $this->assertDatabaseHas('mascota_inventario', ['id_alumno' => $alumno->id, 'id_cosmetico' => $cosmetico->id]);
        $this->actingAs($alumno)->getJson('/api/v1/tienda')->assertOk()->assertJsonCount(0, 'premios');
    }

    private function alumno(int $tokens = 20, int $experiencia = 200): Usuario
    {
        return Usuario::create([
            'nombre_completo' => 'Alumno Mascota',
            'usuario' => 'alumno.mascota.'.uniqid(),
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'tokens' => $tokens,
            'experiencia' => $experiencia,
        ]);
    }

    /** @return array{Premio, CosmeticoMascota} */
    private function cosmetico(string $codigo, string $slot, int $precio = 10): array
    {
        $premio = Premio::create([
            'nombre' => $codigo,
            'descripcion' => 'Cosmetico de prueba',
            'precio' => $precio,
            'stock' => 5,
            'categoria' => 'GENERAL',
            'tipo_entrega' => 'cosmetico',
        ]);
        $cosmetico = CosmeticoMascota::create([
            'id_premio' => $premio->id,
            'codigo' => $codigo,
            'nombre' => $codigo,
            'slot' => $slot,
            'rareza' => 'comun',
            'asset_capa' => "img/mascotas/daemon-origen/{$slot}/{$codigo}.webp",
            'orden_capa' => 30,
            'activo' => true,
        ]);
        $cosmetico->especies()->attach(EspecieMascota::firstOrFail()->id);

        return [$premio, $cosmetico];
    }
}
