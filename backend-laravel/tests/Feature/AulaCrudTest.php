<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AulaCrudTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): Usuario
    {
        return Usuario::create([
            'nombre_completo' => 'Admin Aulas',
            'correo' => 'admin.aulas@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'admin',
            'nivel' => 'TEENS',
        ]);
    }

    private function docente(): array
    {
        $institucion = Institucion::firstOrCreate(['slug' => 'daemon-general'], ['nombre' => 'DAEMON']);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula Mia',
            'nivel' => 'TEENS',
        ]);
        $docente = Usuario::create([
            'nombre_completo' => 'Docente Aula',
            'correo' => 'docente.aulas@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_aula' => $aula->id,
            'id_institucion' => $institucion->id,
        ]);

        return [$docente, $aula, $institucion];
    }

    public function test_admin_crea_y_actualiza_aula(): void
    {
        $admin = $this->admin();

        $creada = $this->actingAs($admin)->postJson('/api/v1/docente/aulas', [
            'nombre' => 'Aula Nueva',
            'nivel' => 'KIDS',
        ])->assertCreated();

        $id = $creada->json('id');

        $this->actingAs($admin)->putJson("/api/v1/docente/aulas/{$id}", [
            'nombre' => 'Aula Renombrada',
            'nivel' => 'PRO',
        ])->assertOk()
            ->assertJsonPath('nombre', 'Aula Renombrada')
            ->assertJsonPath('nivel', 'PRO');

        $this->assertDatabaseHas('aulas', ['id' => $id, 'nombre' => 'Aula Renombrada', 'nivel' => 'PRO']);
    }

    public function test_docente_puede_actualizar_su_aula_pero_no_otra(): void
    {
        [$docente, $aula] = $this->docente();
        $otra = Aula::create([
            'id_institucion' => $aula->id_institucion,
            'nombre' => 'Aula Ajena',
            'nivel' => 'KIDS',
        ]);

        $this->actingAs($docente)->putJson("/api/v1/docente/aulas/{$aula->id}", [
            'nombre' => 'Aula Mia Edit',
        ])->assertOk()->assertJsonPath('nombre', 'Aula Mia Edit');

        $this->actingAs($docente)->putJson("/api/v1/docente/aulas/{$otra->id}", [
            'nombre' => 'Hack',
        ])->assertForbidden();
    }

    public function test_aula_con_alumnos_no_puede_eliminarse(): void
    {
        [$docente, $aula, $institucion] = $this->docente();
        Usuario::create([
            'nombre_completo' => 'Alumno',
            'correo' => 'alumno.aulas@example.com',
            'clave' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_aula' => $aula->id,
            'id_institucion' => $institucion->id,
        ]);

        $this->actingAs($docente)->deleteJson("/api/v1/docente/aulas/{$aula->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('aulas', ['id' => $aula->id]);
    }

    public function test_aula_vacia_se_elimina(): void
    {
        $admin = $this->admin();
        $aula = $this->actingAs($admin)->postJson('/api/v1/docente/aulas', [
            'nombre' => 'Aula Vacia',
        ])->json('id');

        $this->actingAs($admin)->deleteJson("/api/v1/docente/aulas/{$aula}")
            ->assertNoContent();

        $this->assertDatabaseMissing('aulas', ['id' => $aula]);
    }
}