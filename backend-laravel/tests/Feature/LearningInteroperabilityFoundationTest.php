<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\MovimientoEconomia;
use App\Models\RegistroLti;
use App\Models\Usuario;
use App\Services\Economia\EconomiaService;
use App\Services\Interoperabilidad\OneRosterAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

class LearningInteroperabilityFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_curriculo_matricula_y_progreso_funcionan_sin_romper_aula_legacy(): void
    {
        [$institucion, $aula, $admin, $alumno] = $this->escenario();

        $periodoId = $this->actingAs($admin)->postJson('/api/v1/academico/periodos', [
            'id_institucion' => $institucion->id,
            'titulo' => 'Año 2026',
            'tipo' => 'schoolYear',
            'fecha_inicio' => '2026-03-01',
            'fecha_fin' => '2026-12-20',
        ])->assertCreated()->json('id');

        $cursoId = $this->actingAs($admin)->postJson('/api/v1/academico/cursos', [
            'id_institucion' => $institucion->id,
            'titulo' => 'Pensamiento computacional',
            'codigo' => 'PC-01',
            'nivel' => 'TEENS',
        ])->assertCreated()->json('id');

        $unidadId = $this->actingAs($admin)->postJson("/api/v1/academico/cursos/{$cursoId}/unidades", [
            'titulo' => 'Algoritmos',
            'orden' => 1,
            'estado' => 'published',
        ])->assertCreated()->json('id');

        $leccionId = $this->actingAs($admin)->postJson("/api/v1/academico/unidades/{$unidadId}/lecciones", [
            'titulo' => 'Secuencias',
            'orden' => 1,
            'estado' => 'published',
            'contenido' => [['tipo' => 'texto', 'valor' => 'Primero, después y al final.']],
        ])->assertCreated()->json('id');

        $this->actingAs($admin)->putJson("/api/v1/academico/cursos/{$cursoId}", [
            'id_institucion' => $institucion->id,
            'titulo' => 'Pensamiento computacional',
            'codigo' => 'PC-01',
            'nivel' => 'TEENS',
            'estado' => 'published',
        ])->assertOk()->assertJsonPath('estado', 'published');

        $this->actingAs($admin)->putJson("/api/v1/academico/aulas/{$aula->id}/curso", [
            'id_curso' => $cursoId,
            'id_periodo_academico' => $periodoId,
        ])->assertOk();

        $this->actingAs($admin)->postJson("/api/v1/academico/aulas/{$aula->id}/usuarios/{$alumno->id}", [
            'rol' => 'student',
            'es_principal' => true,
        ])->assertCreated();

        $this->actingAs($alumno)->getJson('/api/v1/alumno/aprendizaje')
            ->assertOk()
            ->assertJsonPath('cursos.0.id', $cursoId)
            ->assertJsonPath('resumen.lecciones', 1);

        $this->actingAs($alumno)->putJson("/api/v1/alumno/aprendizaje/lecciones/{$leccionId}/progreso", [
            'estado' => 'completed',
            'porcentaje' => 80,
        ])->assertOk()->assertJsonPath('porcentaje', 100);

        $this->assertSame($aula->id, $alumno->fresh()->id_aula);
        $this->assertDatabaseHas('eventos_dominio', ['tipo' => 'academico.leccion_completada', 'agregado_id' => (string) $leccionId]);
    }

    public function test_ledger_es_idempotente_inmutable_y_separa_xp_de_daemons(): void
    {
        [, , , $alumno] = $this->escenario();
        $economia = app(EconomiaService::class);

        $economia->otorgarDual($alumno, 25, 'test', 'reward-1', null, 'reward:test:1');
        $economia->otorgarDual($alumno, 25, 'test', 'reward-1', null, 'reward:test:1');
        $economia->ajustarDaemons($alumno, -10, 'test_purchase', 'purchase-1', $alumno, 'purchase:test:1');

        $alumno->refresh();
        $this->assertSame(225, $alumno->experiencia);
        $this->assertSame(35, $alumno->tokens);
        $this->assertDatabaseCount('movimientos_economia', 3);
        $this->assertDatabaseCount('eventos_dominio', 3);

        $this->expectException(LogicException::class);
        MovimientoEconomia::firstOrFail()->delete();
    }

    public function test_oneroster_usa_client_credentials_y_ailla_institucion(): void
    {
        [$institucion] = $this->escenario();
        $credenciales = app(OneRosterAuthService::class)->crearCliente($institucion->id, 'SIS de prueba');
        $cliente = $credenciales['cliente'];

        $token = $this->postJson('/ims/oneroster/oauth2/token', [
            'grant_type' => 'client_credentials',
            'client_id' => $cliente->client_id,
            'client_secret' => $credenciales['client_secret'],
        ])->assertOk()->assertJsonPath('token_type', 'Bearer')->json('access_token');

        $this->getJson('/ims/oneroster/rostering/v1p2/orgs')->assertUnauthorized();

        $this->withToken($token)->getJson('/ims/oneroster/rostering/v1p2/orgs?limit=10')
            ->assertOk()
            ->assertHeader('X-Total-Count', '1')
            ->assertJsonPath('orgs.0.sourcedId', $institucion->sourced_id)
            ->assertJsonPath('orgs.0.type', 'school');

    }

    public function test_lti_login_solo_inicia_registros_activos_y_genera_state_nonce(): void
    {
        [$institucion] = $this->escenario();
        $registro = RegistroLti::create([
            'id_institucion' => $institucion->id,
            'uuid' => (string) Str::uuid(),
            'nombre' => 'LMS prueba',
            'rol_daemon' => 'tool',
            'issuer' => 'https://lms.example.test',
            'client_id' => 'daemon-client',
            'deployment_id' => 'deployment-1',
            'auth_login_url' => 'https://lms.example.test/oidc/auth',
            'keyset_url' => 'https://lms.example.test/jwks',
            'activo' => true,
        ]);

        $respuesta = $this->get('/lti/login?'.http_build_query([
            'iss' => $registro->issuer,
            'client_id' => $registro->client_id,
            'login_hint' => 'opaque-login-hint',
        ]))->assertRedirect();
        parse_str(parse_url($respuesta->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertSame('openid', $query['scope']);
        $this->assertSame($registro->client_id, $query['client_id']);
        $this->assertNotEmpty($query['nonce']);
        $this->assertNotNull(Cache::get('lti:state:'.$query['state']));
    }

    private function escenario(): array
    {
        $institucion = Institucion::create(['nombre' => 'Colegio Prueba', 'slug' => 'colegio-prueba-'.Str::lower(Str::random(5))]);
        $aula = Aula::create(['id_institucion' => $institucion->id, 'nombre' => 'Aula Uno', 'nivel' => 'TEENS']);
        $admin = Usuario::create([
            'nombre_completo' => 'Admin Prueba', 'usuario' => 'admin.'.Str::lower(Str::random(6)),
            'password_hash' => bcrypt('secret-123'), 'rol' => 'admin', 'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
        ]);
        $alumno = Usuario::create([
            'nombre_completo' => 'Alumno Prueba', 'usuario' => 'alumno.'.Str::lower(Str::random(6)),
            'password_hash' => bcrypt('secret-123'), 'rol' => 'alumno', 'nivel' => 'TEENS',
            'tokens' => 20, 'experiencia' => 200, 'id_institucion' => $institucion->id, 'id_aula' => $aula->id,
        ]);

        return [$institucion, $aula, $admin, $alumno];
    }
}
