<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Entrega;
use App\Models\Institucion;
use App\Models\Mision;
use App\Models\Premio;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GamificacionXpTest extends TestCase
{
    use RefreshDatabase;

    public function test_aprobar_mision_suma_experiencia_y_tokens_una_sola_vez(): void
    {
        [$docente, $alumno] = $this->usuariosDeAula();
        $mision = Mision::create([
            'titulo' => 'Reto XP',
            'descripcion' => 'Prueba de recompensa dual',
            'recompensa' => 75,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'TEENS',
            'estado' => 'activo',
            'es_mision_nivel' => false,
        ]);
        $entrega = Entrega::create([
            'id_desafio' => $mision->id,
            'id_alumno' => $alumno->id,
            'archivo_url' => 'Respuesta de prueba',
            'estado' => 'pendiente',
        ]);

        $this->actingAs($docente)->postJson("/api/v1/misiones/entregas/{$entrega->id}/revisar", [
            'estado' => 'aprobado',
            'calificacion' => 75,
        ])->assertOk();

        $alumno->refresh();
        $this->assertSame(95, $alumno->tokens);
        $this->assertSame(275, $alumno->experiencia);

        $this->actingAs($docente)->postJson("/api/v1/misiones/entregas/{$entrega->id}/revisar", [
            'estado' => 'aprobado',
            'calificacion' => 75,
        ])->assertOk();

        $alumno->refresh();
        $this->assertSame(95, $alumno->tokens);
        $this->assertSame(275, $alumno->experiencia);
    }

    public function test_canjear_premio_reduce_tokens_pero_conserva_experiencia(): void
    {
        [, $alumno] = $this->usuariosDeAula();
        $premio = Premio::create([
            'nombre' => 'Pase creativo',
            'descripcion' => 'Premio de prueba',
            'precio' => 15,
            'stock' => 2,
            'categoria' => 'TEENS',
            'tipo_entrega' => 'fisico',
        ]);

        $this->actingAs($alumno)
            ->postJson("/api/v1/tienda/canjear/{$premio->id}")
            ->assertOk()
            ->assertJsonPath('saldo', 5);

        $alumno->refresh();
        $this->assertSame(5, $alumno->tokens);
        $this->assertSame(200, $alumno->experiencia);
    }

    public function test_ranking_se_ordena_por_experiencia_y_no_expone_saldo(): void
    {
        [, $alumno] = $this->usuariosDeAula();
        $rival = Usuario::create([
            'nombre_completo' => 'Rival XP',
            'usuario' => 'rival.xp',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'tokens' => 900,
            'experiencia' => 150,
        ]);

        $respuesta = $this->getJson('/api/v1/ranking')->assertOk();

        $respuesta->assertJsonPath('0.id', $alumno->id)
            ->assertJsonPath('1.id', $rival->id)
            ->assertJsonMissingPath('0.tokens');
    }

    /** @return array{Usuario, Usuario} */
    private function usuariosDeAula(): array
    {
        $institucion = Institucion::firstOrCreate(['slug' => 'daemon-general'], ['nombre' => 'DAEMON']);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula XP',
            'nivel' => 'TEENS',
        ]);
        $docente = Usuario::create([
            'nombre_completo' => 'Docente XP',
            'usuario' => 'docente.xp',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
            'id_aula' => $aula->id,
        ]);
        $alumno = Usuario::create([
            'nombre_completo' => 'Alumno XP',
            'usuario' => 'alumno.xp',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'tokens' => 20,
            'experiencia' => 200,
            'id_institucion' => $institucion->id,
            'id_aula' => $aula->id,
        ]);

        return [$docente, $alumno];
    }
}
