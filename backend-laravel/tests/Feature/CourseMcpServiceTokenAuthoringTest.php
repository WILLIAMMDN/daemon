<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\HitoAprendizaje;
use App\Models\Institucion;
use App\Models\Usuario;
use App\Support\Autoria\AlcanceAutoria;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

require_once __DIR__.'/../../database/seeders/IaOrigenTeensReferenceCourseSeeder.php';

/**
 * Course MCP Foundation V1 — autenticación headless de servicio.
 *
 * Prueba el contrato que un adaptador MCP consume: un token Sanctum de servicio
 * con alcances mínimos entra por la MISMA API canónica que Course Studio, puede
 * leer y escribir borradores, y no puede publicar. Las reglas se comprueban en
 * el servidor: que el cliente MCP no exponga una herramienta de publicación es
 * ergonomía, no seguridad.
 */
class CourseMcpServiceTokenAuthoringTest extends TestCase
{
    use RefreshDatabase;

    protected function migrateUsing(): array
    {
        return [
            '--path' => realpath(__DIR__.'/../../database/migrations'),
            '--realpath' => true,
        ];
    }

    private Institucion $institucion;

    private array $datosCurso;

    private Usuario $docente;

    private string $tokenMcp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institucion = Institucion::create([
            'nombre' => 'DAEMON Innovation School',
            'slug' => 'daemon-innovation',
        ]);

        $aula = Aula::create([
            'id_institucion' => $this->institucion->id,
            'nombre' => 'Cohorte IA Teens 2026',
            'nivel' => 'TEENS',
        ]);

        $this->datosCurso = (new IaOrigenTeensReferenceCourseSeeder)->seedForInstitution($this->institucion, $aula);
        $this->docente = $this->crearUsuario('docente', $this->institucion, 'ana-autora');
        $this->tokenMcp = $this->emitirTokenDeServicio($this->docente);
    }

    /* ------------------------------------------------------------------ */
    /* Autenticación headless                                              */
    /* ------------------------------------------------------------------ */

    public function test_service_token_reads_the_canonical_authoring_surface_without_a_session_cookie(): void
    {
        $catalogo = $this->conToken()->getJson('/api/v1/academico/studio/catalogo');
        $catalogo->assertOk();
        $catalogo->assertJsonPath('authoringScopes.read', AlcanceAutoria::LECTURA);
        $catalogo->assertJsonPath('authoringScopes.publish', AlcanceAutoria::PUBLICACION);
        $catalogo->assertJsonPath('publication.humanReviewRequired', true);
        $this->assertNotEmpty($catalogo->json('experienceTypes'));
        $this->assertNotEmpty($catalogo->json('evidenceModalities'));
        $this->assertSame(150, $catalogo->json('authoringConstraints.titleMaxLength'));

        $cursos = $this->conToken()->getJson('/api/v1/academico/studio/cursos');
        $cursos->assertOk();
        $this->assertSame('IA-ORIGEN-TEENS', $cursos->json('courses.0.code'));

        $version = $this->conToken()->getJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id);
        $version->assertOk();
        $version->assertJsonPath('version.status', 'published');
        $version->assertJsonPath('editable', false);
    }

    public function test_service_token_is_stored_hashed_with_least_privilege_and_an_expiry(): void
    {
        $registro = PersonalAccessToken::findToken($this->tokenMcp);

        $this->assertNotNull($registro);
        $this->assertSame(AlcanceAutoria::porDefectoMcp(), $registro->abilities);
        $this->assertNotContains('*', $registro->abilities);
        $this->assertNotContains(AlcanceAutoria::PUBLICACION, $registro->abilities);
        $this->assertNotNull($registro->expires_at);

        // El valor en claro nunca se persiste.
        $this->assertDatabaseMissing('personal_access_tokens', ['token' => $this->tokenMcp]);
        $this->assertSame(hash('sha256', explode('|', $this->tokenMcp, 2)[1]), $registro->token);
    }

    public function test_service_token_outlives_the_interactive_session_window_but_not_its_own_expiry(): void
    {
        // La ventana deslizante de `sanctum.expiration` es de sesión de
        // navegador; un cliente headless no tiene sesión que refrescar.
        config(['sanctum.expiration' => 480]);
        $this->envejecerToken($this->tokenMcp, minutos: 10_000);
        $this->conToken()->getJson('/api/v1/academico/studio/cursos')->assertOk();

        // Pero sí caduca por su propio expires_at.
        PersonalAccessToken::findToken($this->tokenMcp)->forceFill(['expires_at' => now()->subMinute()])->save();
        $this->conToken()->getJson('/api/v1/academico/studio/cursos')->assertUnauthorized();
    }

    public function test_an_interactive_token_keeps_the_previous_expiration_rule(): void
    {
        config(['sanctum.expiration' => 480]);
        $navegador = $this->docente->createToken('angular')->plainTextToken;

        $this->comoServicio($navegador)->getJson('/api/v1/academico/studio/cursos')->assertOk();

        $this->envejecerToken($navegador, minutos: 10_000);
        $this->comoServicio($navegador)->getJson('/api/v1/academico/studio/cursos')->assertUnauthorized();
    }

    /* ------------------------------------------------------------------ */
    /* Matriz de autorización                                              */
    /* ------------------------------------------------------------------ */

    public function test_invalid_token_is_denied(): void
    {
        $this->comoServicio('999|token-que-no-existe')->getJson('/api/v1/academico/studio/cursos')->assertUnauthorized();
        $this->comoServicio('basura')->getJson('/api/v1/academico/studio/cursos')->assertUnauthorized();
    }

    public function test_revoked_token_is_denied(): void
    {
        PersonalAccessToken::findToken($this->tokenMcp)->delete();

        $this->conToken()->getJson('/api/v1/academico/studio/cursos')->assertUnauthorized();
        $this->conToken()->postJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id.'/borrador', [])
            ->assertUnauthorized();
    }

    public function test_a_student_token_cannot_author_even_with_authoring_scopes(): void
    {
        $alumno = $this->crearUsuario('alumno', $this->institucion, 'valeria-luna');
        $token = $this->emitirTokenDeServicio($alumno, forzar: true);

        $this->comoServicio($token)->getJson('/api/v1/academico/studio/cursos')->assertForbidden();
        $this->comoServicio($token)->postJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id.'/borrador', [])
            ->assertForbidden();
    }

    public function test_an_actor_from_another_institution_is_denied(): void
    {
        $otra = Institucion::create(['nombre' => 'Otra Escuela', 'slug' => 'otra-escuela']);
        $token = $this->emitirTokenDeServicio($this->crearUsuario('docente', $otra, 'docente-externo'));

        $this->comoServicio($token)->getJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id)->assertForbidden();
        $this->comoServicio($token)->postJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id.'/borrador', [])
            ->assertForbidden();
    }

    public function test_a_read_only_token_cannot_write_a_draft(): void
    {
        $borrador = $this->crearBorrador();
        $token = $this->emitirTokenDeServicio($this->docente, alcances: [AlcanceAutoria::LECTURA]);

        $this->comoServicio($token)->getJson('/api/v1/academico/studio/versiones/'.$borrador['version']['id'])->assertOk();
        $this->comoServicio($token)
            ->postJson('/api/v1/academico/rutas/'.$borrador['paths'][0]['id'].'/hitos', ['titulo' => 'Hito', 'orden' => 9])
            ->assertForbidden();
    }

    /* ------------------------------------------------------------------ */
    /* La publicación nunca es del token de servicio                       */
    /* ------------------------------------------------------------------ */

    public function test_service_token_cannot_publish_through_any_canonical_endpoint(): void
    {
        $borrador = $this->crearBorrador();
        $versionId = $borrador['version']['id'];
        $rutaId = $borrador['paths'][0]['id'];

        foreach ([
            "/api/v1/academico/studio/versiones/{$versionId}/publicacion",
            "/api/v1/academico/versiones/{$versionId}/publicar",
            "/api/v1/academico/rutas/{$rutaId}/publicar",
            "/api/v1/academico/versiones/{$versionId}/archivar",
        ] as $ruta) {
            $respuesta = $this->conToken()->postJson($ruta, []);
            $this->assertSame(403, $respuesta->status(), "La publicación debería estar denegada en {$ruta}.");
            $this->assertStringContainsString(AlcanceAutoria::PUBLICACION, (string) $respuesta->json('message'));
        }

        // La versión sigue en borrador: ningún intento la movió.
        $this->assertSame('draft', $this->conToken()->getJson("/api/v1/academico/studio/versiones/{$versionId}")->json('version.status'));
    }

    public function test_the_command_refuses_to_mint_a_publishing_token(): void
    {
        $this->artisan('autoria:token', [
            'accion' => 'emitir',
            '--actor' => $this->docente->usuario,
            '--alcances' => 'course:read,course:write,course:publish',
        ])->assertExitCode(1);

        $this->assertSame(
            0,
            PersonalAccessToken::query()->get()
                ->filter(fn (PersonalAccessToken $token): bool => in_array(AlcanceAutoria::PUBLICACION, (array) $token->abilities, true))
                ->count(),
        );
    }

    public function test_a_human_session_can_still_publish(): void
    {
        $borrador = $this->crearBorrador();
        $versionId = $borrador['version']['id'];

        // Sesión interactiva: sin token de servicio, el rol sigue siendo la
        // autoridad y la publicación humana no se ve afectada.
        $respuesta = $this->comoHumano()
            ->postJson("/api/v1/academico/studio/versiones/{$versionId}/publicacion", []);

        $respuesta->assertOk();
        $this->assertSame('published', $respuesta->json('version.status'));
    }

    /* ------------------------------------------------------------------ */
    /* Regresiones de dominio, comprobadas del lado del servidor           */
    /* ------------------------------------------------------------------ */

    public function test_service_token_cannot_mutate_the_published_reference_version(): void
    {
        $version = $this->versionV1();
        $hito = HitoAprendizaje::whereIn('id_ruta', $this->datosCurso['ruta']->newQuery()->pluck('id'))->firstOrFail();

        $metadatos = $this->conToken()->putJson("/api/v1/academico/versiones/{$version->id}", [
            'titulo' => 'IA_ORIGEN_TEENS_2026_V1_HACKEADA',
            'audiencia' => 'TEENS',
            'etapa' => 'inicial',
        ]);
        $metadatos->assertStatus(409);

        $this->conToken()->putJson("/api/v1/academico/hitos/{$hito->id}", ['titulo' => 'Hito reescrito'])
            ->assertStatus(409);
        $this->conToken()->deleteJson("/api/v1/academico/hitos/{$hito->id}")->assertStatus(409);
        $this->conToken()->postJson("/api/v1/academico/rutas/{$this->datosCurso['ruta']->id}/hitos", [
            'titulo' => 'Hito nuevo en publicada',
            'orden' => 99,
        ])->assertStatus(409);

        $version->refresh();
        $this->assertSame('IA_ORIGEN_TEENS_2026_V1', $version->titulo);
        $this->assertSame('published', $version->estado);
        $this->assertSame('¿La IA piensa?', $hito->fresh()->titulo);
    }

    public function test_service_token_cannot_bypass_prerequisite_cycle_detection(): void
    {
        $borrador = $this->crearBorrador();
        $hitos = collect($borrador['paths'][0]['milestones']);
        $primero = (int) $hitos[0]['id'];
        $segundo = (int) $hitos[1]['id'];

        $this->conToken()->putJson("/api/v1/academico/hitos/{$primero}/prerrequisitos", ['prerrequisitos' => [$segundo]])
            ->assertStatus(422);

        // El grafo original (M1 -> M2 -> ...) queda intacto.
        $this->assertSame(
            [],
            DB::table('hito_prerrequisitos')->where('id_hito', $primero)->pluck('id_prerrequisito')->all(),
        );
    }

    public function test_service_token_cannot_bypass_field_or_reference_validation(): void
    {
        $borrador = $this->crearBorrador();
        $hitoId = (int) $borrador['paths'][0]['milestones'][0]['id'];

        $this->conToken()->postJson("/api/v1/academico/hitos/{$hitoId}/experiencias", [
            'tipo' => 'quiz',
            'titulo' => 'Tipo inexistente',
            'orden' => 50,
        ])->assertStatus(422)->assertJsonValidationErrors('tipo');

        $this->conToken()->postJson("/api/v1/academico/hitos/{$hitoId}/experiencias", [
            'tipo' => 'practica',
            'titulo' => 'Evidencia inválida',
            'orden' => 51,
            'guia_entrega' => ['evidencia' => ['modalidades' => ['video'], 'minimo_artefactos' => 99]],
        ])->assertStatus(422)->assertJsonValidationErrors('guia_entrega');

        $otra = Institucion::create(['nombre' => 'Tercera', 'slug' => 'tercera']);
        $objetivoAjeno = DB::table('objetivos_aprendizaje')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $otra->id,
            'codigo' => 'X-01',
            'descripcion' => 'Objetivo de otra institución.',
        ]);

        $this->conToken()->postJson("/api/v1/academico/hitos/{$hitoId}/experiencias", [
            'tipo' => 'practica',
            'titulo' => 'Objetivo ajeno',
            'orden' => 52,
            'objetivos' => [$objetivoAjeno],
        ])->assertStatus(422);
    }

    /* ------------------------------------------------------------------ */
    /* Autoría real de borrador vía token de servicio                      */
    /* ------------------------------------------------------------------ */

    public function test_service_token_authors_a_draft_that_course_studio_reads_identically(): void
    {
        $borrador = $this->crearBorrador();
        $versionId = (int) $borrador['version']['id'];
        $hitoId = (int) $borrador['paths'][0]['milestones'][0]['id'];

        $experiencia = $this->conToken()->postJson("/api/v1/academico/hitos/{$hitoId}/experiencias", [
            'tipo' => 'practica',
            'titulo' => 'Práctica escrita por el token de servicio',
            'orden' => 90,
            'obligatoria' => true,
            'guia_entrega' => [
                'evidencia' => ['modalidades' => ['text', 'pdf'], 'obligatoria' => true, 'minimo_artefactos' => 1],
                'rubrica' => ['titulo' => 'Rúbrica', 'criterios' => [['codigo' => 'C1', 'titulo' => 'Claridad']]],
            ],
            'contenido' => ['summary' => 'Resumen', 'blocks' => [['type' => 'concepto', 'text' => 'Idea']]],
        ]);
        $experiencia->assertCreated();
        $experienciaId = (int) $experiencia->json('id');

        $this->conToken()->putJson("/api/v1/academico/experiencias/{$experienciaId}/objetivos", [
            'objetivos' => [$this->datosCurso['objetivos']['AI-01']->id],
        ])->assertOk();

        $validacion = $this->conToken()->getJson("/api/v1/academico/studio/versiones/{$versionId}/validacion");
        $validacion->assertOk();
        $this->assertTrue($validacion->json('ready'));

        // Course Studio (sesión humana) ve exactamente lo mismo: la escritura
        // del token de servicio no deja ninguna forma propia en el dominio.
        $studio = $this->comoHumano()->getJson("/api/v1/academico/studio/versiones/{$versionId}");
        $studio->assertOk();
        $escrita = collect($studio->json('paths.0.milestones.0.experiences'))->firstWhere('id', $experienciaId);

        $this->assertNotNull($escrita);
        $this->assertSame('practica', $escrita['type']);
        $this->assertSame(['text', 'pdf'], $escrita['evidence']['modalities']);
        $this->assertSame('Claridad', $escrita['rubric']['criteria'][0]['title']);
        $this->assertSame([$this->datosCurso['objetivos']['AI-01']->id], $escrita['objectiveIds']);
        $this->assertSame('draft', $studio->json('version.status'));
    }

    public function test_the_draft_never_reports_a_published_state_to_the_service_client(): void
    {
        $borrador = $this->crearBorrador();

        $this->assertSame('draft', $borrador['version']['status']);
        $this->assertTrue($borrador['editable']);
        $this->assertSame('published', $this->versionV1()->estado);
    }

    /* ------------------------------------------------------------------ */
    /* Utilidades                                                          */
    /* ------------------------------------------------------------------ */

    private function versionV1()
    {
        return $this->datosCurso['version']->fresh();
    }

    private function conToken(): self
    {
        return $this->comoServicio($this->tokenMcp);
    }

    /**
     * Autentica la siguiente petición con un bearer token limpio.
     *
     * Laravel cachea el RequestGuard resuelto durante toda la vida de la
     * aplicación de prueba, así que sin olvidar los guards la segunda petición
     * de un mismo test reutilizaría el actor de la primera y la matriz de
     * autorización no probaría nada.
     */
    private function comoServicio(string $token): self
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    /** Sesión interactiva humana, el camino de Course Studio. */
    private function comoHumano(): self
    {
        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => null]);

        return $this->actingAs($this->docente);
    }

    private function crearBorrador(): array
    {
        $respuesta = $this->conToken()
            ->postJson('/api/v1/academico/studio/versiones/'.$this->versionV1()->id.'/borrador', []);
        $respuesta->assertCreated();

        return $respuesta->json();
    }

    /**
     * @param  list<string>|null  $alcances
     */
    private function emitirTokenDeServicio(Usuario $actor, ?array $alcances = null, bool $forzar = false): string
    {
        // `forzar` emite directamente para poder probar que el rol, y no sólo el
        // comando de emisión, es la barrera real del lado del servidor.
        if ($forzar) {
            return $actor->createToken('mcp-forzado', $alcances ?? AlcanceAutoria::porDefectoMcp(), now()->addDays(90))
                ->plainTextToken;
        }

        return $actor->createToken('daemon-course-mcp', $alcances ?? AlcanceAutoria::porDefectoMcp(), now()->addDays(90))
            ->plainTextToken;
    }

    private function envejecerToken(string $plano, int $minutos): void
    {
        PersonalAccessToken::findToken($plano)->forceFill(['created_at' => now()->subMinutes($minutos)])->save();
    }

    private function crearUsuario(string $rol, Institucion $institucion, string $usuario): Usuario
    {
        return Usuario::create([
            'nombre_completo' => ucfirst($usuario),
            'email' => $usuario.'@daemon.test',
            'usuario' => $usuario,
            'password_hash' => bcrypt('secreto-daemon'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
            'perfil_completo' => true,
        ]);
    }
}
