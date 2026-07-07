<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\Premio;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PremioCrudTest extends TestCase
{
    use RefreshDatabase;

    private function docente(): Usuario
    {
        $institucion = Institucion::firstOrCreate(['slug' => 'daemon-general'], ['nombre' => 'DAEMON']);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula Tienda',
            'nivel' => 'TEENS',
        ]);

        return Usuario::create([
            'nombre_completo' => 'Docente Tienda',
            'correo' => 'docente.tienda@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_aula' => $aula->id,
            'id_institucion' => $institucion->id,
        ]);
    }

    public function test_docente_crea_premio(): void
    {
        $docente = $this->docente();

        $this->actingAs($docente)->postJson('/api/v1/tienda/premios', [
            'nombre' => 'Sticker DAEMON',
            'descripcion' => 'Sticker para los cracks',
            'precio' => 20,
            'stock' => 100,
            'categoria' => 'GENERAL',
            'tipo_entrega' => 'fisico',
        ])->assertCreated()
            ->assertJsonPath('nombre', 'Sticker DAEMON');

        $this->assertDatabaseHas('premios', ['nombre' => 'Sticker DAEMON', 'precio' => 20]);
    }

    public function test_docente_actualiza_premio(): void
    {
        $docente = $this->docente();
        $premio = Premio::create([
            'nombre' => 'Camiseta',
            'descripcion' => 'Original',
            'precio' => 100,
            'stock' => 10,
            'categoria' => 'GENERAL',
            'tipo_entrega' => 'fisico',
            'imagen' => null,
        ]);

        $this->actingAs($docente)->putJson("/api/v1/tienda/premios/{$premio->id}", [
            'precio' => 75,
            'stock' => 25,
        ])->assertOk()
            ->assertJsonPath('precio', 75)
            ->assertJsonPath('stock', 25);

        $this->assertDatabaseHas('premios', ['id' => $premio->id, 'precio' => 75, 'stock' => 25]);
    }

    public function test_docente_elimina_premio(): void
    {
        $docente = $this->docente();
        $premio = Premio::create([
            'nombre' => 'Borrar',
            'descripcion' => null,
            'precio' => 1,
            'stock' => 1,
            'categoria' => 'GENERAL',
            'tipo_entrega' => 'fisico',
        ]);

        $this->actingAs($docente)->deleteJson("/api/v1/tienda/premios/{$premio->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('premios', ['id' => $premio->id]);
    }

    public function test_filtro_busqueda_y_stock(): void
    {
        $docente = $this->docente();
        Premio::create(['nombre' => 'Cuaderno rojo', 'descripcion' => 'Para notas', 'precio' => 10, 'stock' => 5, 'categoria' => 'TEENS', 'tipo_entrega' => 'fisico']);
        Premio::create(['nombre' => 'Cuaderno azul', 'descripcion' => 'Para apuntes', 'precio' => 10, 'stock' => 0, 'categoria' => 'KIDS', 'tipo_entrega' => 'fisico']);
        Premio::create(['nombre' => 'Curso IA', 'descripcion' => 'Curso online', 'precio' => 999, 'stock' => 10, 'categoria' => 'PRO', 'tipo_entrega' => 'digital']);

        $respuesta = $this->actingAs($docente)->getJson('/api/v1/tienda/administrar?q=cuaderno&solo_con_stock=1')
            ->assertOk();

        $nombres = collect($respuesta->json('premios'))->pluck('nombre')->all();
        $this->assertEqualsCanonicalizing(['Cuaderno rojo'], $nombres);
    }
}