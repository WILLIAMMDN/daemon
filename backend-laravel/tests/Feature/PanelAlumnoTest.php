<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Entrega;
use App\Models\Institucion;
use App\Models\Mision;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelAlumnoTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_panel_usa_el_mismo_ranking_del_aula_y_fechas_reales_de_actividad(): void
    {
        CarbonImmutable::setTestNow('2026-07-15 12:00:00');
        $institucion = Institucion::create(['nombre' => 'DAEMON Test', 'slug' => 'daemon-test']);
        $aula = Aula::create([
            'id_institucion' => $institucion->id,
            'nombre' => 'Aula KIDS',
            'nivel' => 'KIDS',
        ]);
        $alumno = Usuario::create([
            'nombre_completo' => 'Luna Estudiante',
            'usuario' => 'luna.panel',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'KIDS',
            'experiencia' => 200,
            'tokens' => 40,
            'id_institucion' => $institucion->id,
            'id_aula' => $aula->id,
        ]);
        Usuario::create([
            'nombre_completo' => 'Alex Rival',
            'usuario' => 'alex.rival',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'KIDS',
            'experiencia' => 300,
            'id_institucion' => $institucion->id,
            'id_aula' => $aula->id,
        ]);
        Usuario::create([
            'nombre_completo' => 'Fuera del Aula',
            'usuario' => 'fuera.aula',
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'KIDS',
            'experiencia' => 9999,
        ]);
        $mision = Mision::create([
            'titulo' => 'Privacidad digital',
            'descripcion' => 'Aprender a proteger datos',
            'recompensa' => 50,
            'tipo_evidencia' => 'texto',
            'nivel_requerido' => 'KIDS',
            'estado' => 'activo',
            'es_mision_nivel' => false,
        ]);
        Entrega::create([
            'id_desafio' => $mision->id,
            'id_alumno' => $alumno->id,
            'archivo_url' => 'Respuesta segura',
            'estado' => 'aprobado',
            'fecha_entrega' => now()->subDays(5),
            'fecha_revision' => now(),
        ]);

        $respuesta = $this->actingAs($alumno)
            ->getJson('/api/v1/alumno/panel')
            ->assertOk()
            ->assertJsonPath('posicion', 2)
            ->assertJsonPath('posicion_scope', 'aula')
            ->assertJsonPath('posicion_scope_label', 'Tu aula')
            ->assertJsonCount(7, 'actividad_semana')
            ->assertJsonPath('actividad_semana.6.fecha', '2026-07-15')
            ->assertJsonPath('actividad_semana.6.activo', true)
            ->assertJsonPath('racha', 1);

        $ranking = $this->actingAs($alumno)->getJson('/api/v1/ranking')->assertOk();
        $ranking->assertJsonPath('alumnos.1.id', $alumno->id)
            ->assertJsonPath('alumnos.1.posicion', $respuesta->json('posicion'));
    }
}
