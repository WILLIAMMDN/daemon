<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\Mision;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MisionCrudTest extends TestCase
{
    use RefreshDatabase;

    private function docente(): Usuario
    {
        $institucion = Institucion::firstOrCreate(['slug' => 'daemon-general'], ['nombre' => 'DAEMON']);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula Test',
            'nivel' => 'TEENS',
        ]);

        return Usuario::create([
            'nombre_completo' => 'Docente CRUD',
            'correo' => 'docente.misiones@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_aula' => $aula->id,
            'id_institucion' => $institucion->id,
        ]);
    }

    public function test_docente_crea_mision(): void
    {
        $docente = $this->docente();

        $respuesta = $this->actingAs($docente)->postJson('/api/v1/misiones', [
            'titulo' => 'Mision feature',
            'descripcion' => 'Creada desde feature test',
            'recompensa' => 50,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TODOS',
            'estado' => 'activo',
        ]);

        $respuesta->assertCreated()
            ->assertJsonPath('titulo', 'Mision feature')
            ->assertJsonPath('recompensa', 50);

        $this->assertDatabaseHas('desafios', ['titulo' => 'Mision feature']);
    }

    public function test_docente_actualiza_mision(): void
    {
        $docente = $this->docente();
        $mision = Mision::create([
            'titulo' => 'Original',
            'descripcion' => 'Original',
            'recompensa' => 30,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
            'es_mision_nivel' => false,
        ]);

        $this->actingAs($docente)->putJson("/api/v1/misiones/{$mision->id}", [
            'titulo' => 'Editada',
            'recompensa' => 80,
        ])->assertOk()
            ->assertJsonPath('titulo', 'Editada')
            ->assertJsonPath('recompensa', 80);

        $this->assertDatabaseHas('desafios', ['id' => $mision->id, 'titulo' => 'Editada', 'recompensa' => 80]);
    }

    public function test_docente_elimina_mision(): void
    {
        $docente = $this->docente();
        $mision = Mision::create([
            'titulo' => 'A borrar',
            'descripcion' => 'desc',
            'recompensa' => 10,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TODOS',
            'estado' => 'activo',
            'es_mision_nivel' => false,
        ]);

        $this->actingAs($docente)->deleteJson("/api/v1/misiones/{$mision->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('desafios', ['id' => $mision->id]);
    }

    public function test_alumno_no_puede_crear_mision(): void
    {
        $alumno = Usuario::create([
            'nombre_completo' => 'Alumno X',
            'correo' => 'alumno.misiones@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
        ]);

        $this->actingAs($alumno)->postJson('/api/v1/misiones', [
            'titulo' => 'No deberia',
            'recompensa' => 1,
        ])->assertForbidden();
    }

    public function test_bulk_destroy_elimina_multiples(): void
    {
        $docente = $this->docente();
        $a = Mision::create(['titulo' => 'A', 'descripcion' => '', 'recompensa' => 10, 'tipo_evidencia' => 'texto', 'nivel_requerido' => 'TODOS', 'estado' => 'activo', 'es_mision_nivel' => false]);
        $b = Mision::create(['titulo' => 'B', 'descripcion' => '', 'recompensa' => 10, 'tipo_evidencia' => 'texto', 'nivel_requerido' => 'TODOS', 'estado' => 'activo', 'es_mision_nivel' => false]);

        $this->actingAs($docente)->postJson('/api/v1/misiones/bulk-destroy', [
            'ids' => [$a->id, $b->id, 9999],
        ])->assertOk()
            ->assertJsonPath('eliminadas', 2);

        $this->assertDatabaseMissing('desafios', ['id' => $a->id]);
        $this->assertDatabaseMissing('desafios', ['id' => $b->id]);
    }
}