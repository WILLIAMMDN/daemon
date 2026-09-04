<?php

namespace Tests\Feature;

use App\Models\ArtefactoAprendizaje;
use App\Models\Aula;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\Usuario;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

require_once __DIR__.'/../../database/seeders/IaOrigenTeensReferenceCourseSeeder.php';

class ArcEvidenceArtifactSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function migrateUsing(): array
    {
        return [
            '--path' => realpath(__DIR__.'/../../database/migrations'),
            '--realpath' => true,
        ];
    }

    private array $datosCurso;

    private Institucion $institucionA;

    private Institucion $institucionB;

    private Aula $aulaA;

    private Aula $aulaB;

    private Usuario $docenteA;

    private Usuario $docenteB;

    private Usuario $alumnoA;

    private Usuario $alumnoB;

    private MatriculaAula $matriculaA;

    private MatriculaAula $matriculaB;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->institucionA = Institucion::create([
            'nombre' => 'DAEMON Innovation School Alpha',
            'slug' => 'daemon-alpha',
        ]);

        $this->institucionB = Institucion::create([
            'nombre' => 'DAEMON Innovation School Beta',
            'slug' => 'daemon-beta',
        ]);

        $this->aulaA = Aula::create([
            'id_institucion' => $this->institucionA->id,
            'nombre' => 'Cohorte IA Teens Alpha',
            'nivel' => 'TEENS',
        ]);

        $this->aulaB = Aula::create([
            'id_institucion' => $this->institucionB->id,
            'nombre' => 'Cohorte IA Teens Beta',
            'nivel' => 'TEENS',
        ]);

        $seeder = new IaOrigenTeensReferenceCourseSeeder;
        $this->datosCurso = $seeder->seedForInstitution($this->institucionA, $this->aulaA);

        $this->docenteA = Usuario::create([
            'nombre_completo' => 'Prof. Alan Turing',
            'usuario' => 'turing_alpha',
            'email' => 'turing@alpha.daemon.edu',
            'password_hash' => bcrypt('password123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionA->id,
            'id_aula' => $this->aulaA->id,
        ]);

        $this->docenteB = Usuario::create([
            'nombre_completo' => 'Prof. Ada Lovelace',
            'usuario' => 'lovelace_beta',
            'email' => 'lovelace@beta.daemon.edu',
            'password_hash' => bcrypt('password123'),
            'rol' => 'docente',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionB->id,
            'id_aula' => $this->aulaB->id,
        ]);

        $this->alumnoA = Usuario::create([
            'nombre_completo' => 'Leo Alumno Alpha',
            'usuario' => 'leo_alpha',
            'email' => 'leo@alumno.daemon.edu',
            'password_hash' => bcrypt('password123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionA->id,
            'id_aula' => $this->aulaA->id,
        ]);

        $this->alumnoB = Usuario::create([
            'nombre_completo' => 'Sara Alumna Beta',
            'usuario' => 'sara_beta',
            'email' => 'sara@alumno.daemon.edu',
            'password_hash' => bcrypt('password123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'id_institucion' => $this->institucionB->id,
            'id_aula' => $this->aulaB->id,
        ]);

        $this->matriculaA = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aulaA->id,
            'id_version_curso' => $this->datosCurso['version']->id,
            'id_ruta_aprendizaje' => $this->datosCurso['ruta']->id,
            'id_usuario' => $this->alumnoA->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
            'fecha_inicio' => today()->subDays(5),
        ]);

        $this->matriculaB = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aulaB->id,
            'id_version_curso' => $this->datosCurso['version']->id,
            'id_ruta_aprendizaje' => $this->datosCurso['ruta']->id,
            'id_usuario' => $this->alumnoB->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
            'fecha_inicio' => today()->subDays(5),
        ]);
    }

    private function completarE1(): void
    {
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $exp1 = $h1->experiencias->firstWhere('orden', 1);

        $leccionId = $exp1->origen_id ?? $exp1->id;
        $this->actingAs($this->alumnoA)->putJson(
            "/api/v1/alumno/aprendizaje/lecciones/{$leccionId}/progreso",
            ['estado' => 'completed', 'porcentaje' => 100],
        )->assertOk();
    }

    private function crearPngFake(string $nombre = 'imagen.png'): UploadedFile
    {
        $contenido = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        return UploadedFile::fake()->createWithContent($nombre, $contenido);
    }

    private function crearPdfFake(string $nombre = 'documento.pdf'): UploadedFile
    {
        $contenido = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF\n";

        return UploadedFile::fake()->createWithContent($nombre, $contenido);
    }

    public function test_upload_security_allowed_files_and_blocked_disallowed_types_and_sizes(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        // Iniciar intento como Alumno A
        $resIntento = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-test-upload-sec-1',
            ]);
        $resIntento->assertStatus(201);
        $intentoId = $resIntento->json('id');

        // 1. Archivo permitido: PNG real
        $pngValido = $this->crearPngFake('captura_lab.png');
        $resPng = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $pngValido,
            ]);
        $resPng->assertStatus(201)
            ->assertJson([
                'category' => 'image',
                'originalName' => 'captura_lab.png',
                'mimeType' => 'image/png',
            ]);
        $this->assertNotNull($resPng->json('downloadUrl'));
        $this->assertNotNull($resPng->json('checksumSha256'));

        // 2. Archivo permitido: PDF
        $pdfValido = $this->crearPdfFake('reporte_experimento.pdf');
        $resPdf = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $pdfValido,
            ]);
        $resPdf->assertStatus(201)
            ->assertJson([
                'category' => 'document',
                'originalName' => 'reporte_experimento.pdf',
                'mimeType' => 'application/pdf',
            ]);

        // 3. Bloqueado: extensión peligrosa (.exe)
        $archivoExe = UploadedFile::fake()->create('malware.exe', 50, 'application/octet-stream');
        $resExe = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $archivoExe,
            ]);
        $resExe->assertStatus(422);

        // 4. Bloqueado: SVG (riesgo de XSS)
        $archivoSvg = UploadedFile::fake()->create('diagrama.svg', 10, 'image/svg+xml');
        $resSvg = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $archivoSvg,
            ]);
        $resSvg->assertStatus(422);

        // 5. Bloqueado: doble extensión peligrosa (exploit.php.png)
        $dobleExt = UploadedFile::fake()->create('exploit.php.png', 50, 'image/png');
        $resDoble = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $dobleExt,
            ]);
        $resDoble->assertStatus(422);

        // 6. Bloqueado: archivo que excede 10 MB
        $archivoGigante = UploadedFile::fake()->create('pesado.pdf', 11 * 1024, 'application/pdf');
        $resGigante = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $archivoGigante,
            ]);
        $resGigante->assertStatus(422);
    }

    public function test_external_link_artifact_support_and_security(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        $resIntento = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-test-link-sec-1',
            ]);
        $resIntento->assertStatus(201);
        $intentoId = $resIntento->json('id');

        // 1. Enlace HTTPS válido
        $resValido = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'url_externa' => 'https://huggingface.co/spaces/leo/reconocedor-emociones',
                'nombre' => 'Demo Interactiva en HuggingFace',
            ]);
        $resValido->assertStatus(201)
            ->assertJson([
                'category' => 'external_link',
                'originalName' => 'Demo Interactiva en HuggingFace',
                'externalUrl' => 'https://huggingface.co/spaces/leo/reconocedor-emociones',
            ]);

        // 2. Esquema peligroso bloqueado: javascript:
        $resJs = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'url_externa' => 'javascript:alert(1)',
            ]);
        $resJs->assertStatus(422);

        // 3. Esquema inseguro no-https bloqueado: http://
        $resHttp = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'url_externa' => 'http://servidor-inseguro.com/demo',
            ]);
        $resHttp->assertStatus(422);

        // 4. Dirección privada / localhost bloqueada (anti-SSRF)
        $resLocal = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'url_externa' => 'https://127.0.0.1:8080/internal',
            ]);
        $resLocal->assertStatus(422);
    }

    public function test_attempt_immutability_and_revision_history(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        // Alumno A inicia Intento 1
        $resIntento1 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-attempt-hist-1',
            ]);
        $intento1Id = $resIntento1->json('id');

        // Sube Artefacto 1 (PDF V1)
        $pdfV1 = $this->crearPdfFake('brief_v1.pdf');
        $resArt1 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intento1Id}/artefactos", [
                'archivo' => $pdfV1,
            ]);
        $resArt1->assertStatus(201);
        $art1Id = $resArt1->json('id');

        // Entrega Evidencia para Intento 1 asociando Artefacto 1
        $resEntrega1 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intento1Id}/evidencias", [
                'tipo' => 'artifact',
                'referencia' => 'Brief inicial del proyecto detector de emociones V1',
                'artefacto_ids' => [$art1Id],
            ]);
        $resEntrega1->assertStatus(200);

        // Intento 1 ahora está enviado (submitted); intentar eliminar artefacto 1 DEBE fallar
        $resBorrarEnviado = $this->actingAs($this->alumnoA)
            ->deleteJson("/api/v1/alumno/aprender/intentos/{$intento1Id}/artefactos/{$art1Id}");
        $resBorrarEnviado->assertStatus(422);

        // Docente solicita revisión (Requiere revisión)
        $this->actingAs($this->docenteA)
            ->postJson("/api/v1/academico/intentos/{$intento1Id}/evaluar", [
                'aprobado' => false,
                'puntaje' => 60,
                'comentario' => '• FORTALEZA: Buena idea. • MEJORA: Definir límites éticos. • SIGUIENTE PASO: Ajustar dataset.',
            ])->assertStatus(200);

        // Alumno A inicia Intento 2
        $resIntento2 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-attempt-hist-2',
            ]);
        $resIntento2->assertStatus(201);
        $intento2Id = $resIntento2->json('id');
        $this->assertNotEquals($intento1Id, $intento2Id);

        // Alumno A sube Artefacto 2 (PDF V2) para Intento 2
        $pdfV2 = $this->crearPdfFake('brief_v2_revisado.pdf');
        $resArt2 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intento2Id}/artefactos", [
                'archivo' => $pdfV2,
            ]);
        $resArt2->assertStatus(201);
        $art2Id = $resArt2->json('id');
        $this->assertNotEquals($art1Id, $art2Id);

        // Entrega Evidencia para Intento 2
        $resEntrega2 = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intento2Id}/evidencias", [
                'tipo' => 'artifact',
                'referencia' => 'Brief revisado V2 con consideraciones éticas incorporadas',
                'artefacto_ids' => [$art2Id],
            ]);
        $resEntrega2->assertStatus(200);

        // Verificar persistencia e inmutabilidad:
        // Artefacto 1 sigue existiendo y vinculado a Intento 1
        $this->assertDatabaseHas('artefactos_aprendizaje', [
            'id' => $art1Id,
            'id_intento' => $intento1Id,
            'nombre_original' => 'brief_v1.pdf',
        ]);

        // Artefacto 2 existe y está vinculado a Intento 2
        $this->assertDatabaseHas('artefactos_aprendizaje', [
            'id' => $art2Id,
            'id_intento' => $intento2Id,
            'nombre_original' => 'brief_v2_revisado.pdf',
        ]);

        // Docente aprueba Intento 2
        $this->actingAs($this->docenteA)
            ->postJson("/api/v1/academico/intentos/{$intento2Id}/evaluar", [
                'aprobado' => true,
                'puntaje' => 95,
                'comentario' => '• FORTALEZA: Excelente incorporación de límites éticos. ¡Aprobado!',
            ])->assertStatus(200);

        // Learning Core marca la experiencia como completada
        $mapaRes = $this->actingAs($this->alumnoA)->getJson('/api/v1/alumno/aprender/mapa')->assertOk();
        $h1Updated = collect($mapaRes->json('milestones'))->firstWhere('order', 1);
        $expLabUpdated = collect($h1Updated['experiences'])->firstWhere('order', 2);
        $this->assertEquals('completed', $expLabUpdated['state']);
    }

    public function test_download_authorization_and_privacy_boundaries(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        // Alumno A crea intento y sube artefacto privado
        $resIntento = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-auth-bound-1',
            ]);
        $intentoId = $resIntento->json('id');

        $img = $this->crearPngFake('evidencia_privada.png');
        $resArt = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $img,
            ]);
        $artId = $resArt->json('id');

        // 1. Estudiante propietario PUEDE descargar su propio artefacto
        $resOwner = $this->actingAs($this->alumnoA)
            ->get("/api/v1/academico/artefactos/{$artId}/contenido");
        $resOwner->assertStatus(200);
        $this->assertEquals('image/png', $resOwner->headers->get('Content-Type'));
        $this->assertEquals('nosniff', $resOwner->headers->get('X-Content-Type-Options'));

        // 2. Otro estudiante (Alumno B) NO PUEDE descargar el artefacto de Alumno A (403 Forbidden)
        $resOtroAlumno = $this->actingAs($this->alumnoB)
            ->get("/api/v1/academico/artefactos/{$artId}/contenido");
        $resOtroAlumno->assertStatus(403);

        // 3. Docente autorizado (Docente A de la misma cohorte/institución) PUEDE acceder
        $resDocenteA = $this->actingAs($this->docenteA)
            ->get("/api/v1/academico/artefactos/{$artId}/contenido");
        $resDocenteA->assertStatus(200);

        // 4. Docente no relacionado (Docente B de otra institución) NO PUEDE acceder (403 Forbidden)
        $resDocenteB = $this->actingAs($this->docenteB)
            ->get("/api/v1/academico/artefactos/{$artId}/contenido");
        $resDocenteB->assertStatus(403);

        // 5. Usuario anónimo NO PUEDE acceder (401 Unauthorized)
        app('auth')->forgetGuards();
        $resAnon = $this->getJson("/api/v1/academico/artefactos/{$artId}/contenido");
        $resAnon->assertStatus(401);
    }

    public function test_production_rejects_incomplete_or_public_storage_without_writing_artifacts(): void
    {
        $intentoId = $this->iniciarIntentoArtefacto('storage-config');
        $this->app->instance('env', 'production');
        Log::spy();

        $privado = [
            'driver' => 's3', 'key' => 'synthetic-key', 'secret' => 'synthetic-secret',
            'endpoint' => 'https://storage.example.test', 'bucket' => 'daemon-private',
        ];
        $casos = [
            ['supabase_private', ['key' => '']],
            ['supabase_private', ['secret' => '']],
            ['supabase_private', ['endpoint' => '']],
            ['supabase_private', ['bucket' => '']],
            ['supabase_private', ['bucket' => 'daemon-assets']],
            ['supabase_private', ['endpoint' => 'http://storage.example.test']],
            ['supabase_private', ['driver' => 'local']],
            ['supabase_private', ['visibility' => 'public']],
            ['local', []], ['public', []], ['missing-disk', []],
        ];

        foreach ($casos as [$disk, $override]) {
            config()->set('daemon.private_uploads_disk', $disk);
            config()->set('filesystems.disks.supabase_private', array_replace($privado, $override));
            $this->actingAs($this->alumnoA)
                ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                    'archivo' => $this->crearPdfFake('synthetic.pdf'),
                ])->assertStatus(503)
                ->assertJsonPath('message', 'El almacenamiento privado de evidencias no está disponible. Inténtalo más tarde.');
            $this->assertDatabaseCount('artefactos_aprendizaje', 0);
            $this->assertSame([], Storage::disk('local')->allFiles());
        }

        Log::shouldHaveReceived('error')->withArgs(fn ($message, $context) => $message === 'artifact_private_storage_unavailable'
            && array_keys($context) === ['reason']
            && in_array($context['reason'], ['invalid_private_disk', 'incomplete_private_config', 'invalid_private_bucket', 'invalid_private_endpoint'], true)
        )->times(count($casos));
    }

    public function test_private_storage_persists_metadata_and_controls_pdf_access(): void
    {
        $intentoId = $this->iniciarIntentoArtefacto('private-storage');
        Storage::fake('supabase_private');
        config()->set('daemon.private_uploads_disk', 'supabase_private');
        config()->set('filesystems.disks.supabase_private', [
            'driver' => 's3', 'key' => 'synthetic-key', 'secret' => 'synthetic-secret',
            'endpoint' => 'https://storage.example.test', 'bucket' => 'daemon-private',
        ]);
        $this->app->instance('env', 'production');

        $id = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $this->crearPdfFake('synthetic.pdf'),
            ])->assertSuccessful()->json('id');
        $artefacto = ArtefactoAprendizaje::findOrFail($id);
        $this->assertSame('supabase_private', $artefacto->disk);
        $this->assertSame($this->alumnoA->id, $artefacto->id_usuario);
        Storage::disk('supabase_private')->assertExists($artefacto->storage_path);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $this->assertSame(hash('sha256', Storage::disk('supabase_private')->get($artefacto->storage_path)), $artefacto->checksum_sha256);

        foreach ([[$this->alumnoA, 200], [$this->alumnoB, 403], [$this->docenteA, 200], [$this->docenteB, 403]] as [$actor, $status]) {
            $res = $this->actingAs($actor)->getJson("/api/v1/academico/artefactos/{$id}/contenido")->assertStatus($status);
            if ($status === 200) {
                $res->assertHeader('Content-Type', 'application/pdf');
            }
        }
        // Ni la misma institución ni la ausencia de aula otorgan acceso global.
        $this->docenteB->forceFill(['id_institucion' => $this->institucionA->id])->save();
        $this->actingAs($this->docenteB)->getJson("/api/v1/academico/artefactos/{$id}/contenido")->assertForbidden();
        $this->docenteB->forceFill(['id_aula' => null])->save();
        $this->actingAs($this->docenteB)->getJson("/api/v1/academico/artefactos/{$id}/contenido")->assertForbidden();
        app('auth')->forgetGuards();
        $this->getJson("/api/v1/academico/artefactos/{$id}/contenido")->assertUnauthorized();
    }

    public function test_failed_private_write_returns_controlled_error_without_metadata_or_local_fallback(): void
    {
        $intentoId = $this->iniciarIntentoArtefacto('storage-outage');
        config()->set('daemon.private_uploads_disk', 'supabase_private');
        config()->set('filesystems.disks.supabase_private', [
            'driver' => 's3', 'key' => 'synthetic-key', 'secret' => 'synthetic-secret',
            'endpoint' => 'https://storage.example.test', 'bucket' => 'daemon-private',
        ]);
        $this->app->instance('env', 'production');
        Log::spy();
        $adapter = \Mockery::mock(Filesystem::class);
        $adapter->shouldReceive('put')->once()->andReturnFalse();
        $adapter->shouldReceive('put')->once()->andThrow(new \RuntimeException('provider-url-with-synthetic-secret'));
        Storage::set('supabase_private', $adapter);

        for ($i = 0; $i < 2; $i++) {
            $this->actingAs($this->alumnoA)
                ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                    'archivo' => $this->crearPdfFake('synthetic.pdf'),
                ])->assertStatus(503)->assertDontSee('provider-url-with-synthetic-secret');
            $this->assertDatabaseCount('artefactos_aprendizaje', 0);
            $this->assertSame([], Storage::disk('local')->allFiles());
        }
        Log::shouldHaveReceived('error')->with('artifact_private_storage_unavailable', ['reason' => 'write_failed'])->twice();
    }

    public function test_explicit_local_storage_remains_valid_only_in_local_and_testing(): void
    {
        $intentoId = $this->iniciarIntentoArtefacto('explicit-local');
        config()->set('daemon.private_uploads_disk', 'local');
        foreach (['local', 'testing'] as $environment) {
            $this->app->instance('env', $environment);
            $id = $this->actingAs($this->alumnoA)
                ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                    'archivo' => $this->crearPdfFake('synthetic.pdf'),
                ])->assertSuccessful()->json('id');
            $artefacto = ArtefactoAprendizaje::findOrFail($id);
            $this->assertSame('local', $artefacto->disk);
            Storage::disk('local')->assertExists($artefacto->storage_path);
        }
        $this->app->instance('env', 'testing');
        config()->set('environment-safety.render_runtime', true);
        $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'archivo' => $this->crearPdfFake('synthetic.pdf'),
            ])->assertStatus(503);
        $this->assertDatabaseCount('artefactos_aprendizaje', 2);
    }

    private function iniciarIntentoArtefacto(string $clave): int
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $experiencia = $ruta->hitos->firstWhere('orden', 1)->experiencias->firstWhere('orden', 2);

        return $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$experiencia->id}/intentos", [
                'idempotency_key' => $clave,
            ])->assertSuccessful()->json('id');
    }

    public function test_teacher_review_queue_and_detail_renders_multimodal_artifacts(): void
    {
        $this->completarE1();
        $ruta = $this->datosCurso['ruta']->fresh(['hitos.experiencias.objetivos']);
        $h1 = $ruta->hitos->firstWhere('orden', 1);
        $expLab = $h1->experiencias->firstWhere('orden', 2);

        $resIntento = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$expLab->id}/intentos", [
                'idempotency_key' => 'idemp-teacher-render-1',
            ]);
        $intentoId = $resIntento->json('id');

        // Sube imagen
        $img = $this->crearPngFake('grafico_precision.png');
        $artImg = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", ['archivo' => $img])
            ->json('id');

        // Sube enlace externo
        $artLink = $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/artefactos", [
                'url_externa' => 'https://colab.research.google.com/drive/notebook-test',
                'nombre' => 'Notebook de Google Colab',
            ])
            ->json('id');

        // Entrega evidencia con ambos artefactos
        $this->actingAs($this->alumnoA)
            ->postJson("/api/v1/alumno/aprender/intentos/{$intentoId}/evidencias", [
                'tipo' => 'lab_output',
                'referencia' => 'Entrenamiento de modelo completado con 94% de precisión.',
                'artefacto_ids' => [$artImg, $artLink],
            ])
            ->assertStatus(200);

        // Docente autorizado consulta detalle de revisión
        $resDetalle = $this->actingAs($this->docenteA)
            ->getJson("/api/v1/academico/revisiones/{$intentoId}");

        $resDetalle->assertStatus(200)
            ->assertJsonPath('data.id', $intentoId)
            ->assertJsonCount(2, 'data.artifacts')
            ->assertJsonCount(2, 'data.evidences.0.artifacts');

        $artifacts = $resDetalle->json('data.artifacts');
        $categorias = array_column($artifacts, 'category');
        $this->assertContains('image', $categorias);
        $this->assertContains('external_link', $categorias);
    }
}
