<?php

namespace Tests\Feature;

use App\Models\Aula;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\Usuario;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
