<?php

namespace Tests\Feature;

use App\Enums\ModalidadEvidencia;
use App\Enums\TipoExperienciaAprendizaje;
use App\Models\Aula;
use App\Models\ExperienciaAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\RutaAprendizaje;
use App\Models\Usuario;
use App\Models\VersionCurso;
use Database\Seeders\IaOrigenTeensReferenceCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

require_once __DIR__.'/../../database/seeders/IaOrigenTeensReferenceCourseSeeder.php';

/**
 * Course Operations / Studio Foundation V1.
 *
 * Prueba la API canónica de autoría sobre el curso de referencia real
 * IA: Origen (Teens): listado, clonado a borrador, autoría de hitos y
 * experiencias, configuración de evidencia y rúbrica, validación de publicación,
 * publicación e inmutabilidad posterior.
 */
class ArcCourseOperationsStudioTest extends TestCase
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

    private Aula $aula;

    private array $datosCurso;

    private Usuario $docente;

    private Usuario $alumno;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institucion = Institucion::create([
            'nombre' => 'DAEMON Innovation School',
            'slug' => 'daemon-innovation',
        ]);

        $this->aula = Aula::create([
            'id_institucion' => $this->institucion->id,
            'nombre' => 'Cohorte IA Teens 2026',
            'nivel' => 'TEENS',
        ]);

        $seeder = new IaOrigenTeensReferenceCourseSeeder;
        $this->datosCurso = $seeder->seedForInstitution($this->institucion, $this->aula);

        $this->docente = $this->crearUsuario('docente', $this->institucion, 'ana-autora');
        $this->alumno = $this->crearUsuario('alumno', $this->institucion, 'valeria-luna');
    }

    /* ------------------------------------------------------------------ */
    /* Listado y estado de versiones                                       */
    /* ------------------------------------------------------------------ */

    public function test_authorized_actor_lists_real_courses_with_version_state(): void
    {
        $respuesta = $this->actingAs($this->docente)->getJson('/api/v1/academico/studio/cursos');

        $respuesta->assertOk();
        $curso = collect($respuesta->json('courses'))->firstWhere('code', 'IA-ORIGEN-TEENS');

        $this->assertNotNull($curso);
        $this->assertSame('IA: Origen', $curso['title']);
        $this->assertSame('TEENS', $curso['audience']);
        $this->assertSame(1, $curso['versionCount']);
        $this->assertSame('published', $curso['publishedVersion']['status']);
        $this->assertFalse($curso['publishedVersion']['editable']);
        $this->assertNull($curso['draftVersion']);
        // Sin métricas inventadas: la cuenta de cohortes viene del dominio.
        $this->assertSame(1, $curso['cohortCount']);
    }

    public function test_published_version_detail_is_read_only(): void
    {
        $version = $this->datosCurso['version'];

        $respuesta = $this->actingAs($this->docente)->getJson("/api/v1/academico/studio/versiones/{$version->id}");

        $respuesta->assertOk();
        $this->assertFalse($respuesta->json('editable'));
        $this->assertSame('published', $respuesta->json('version.status'));
        $this->assertCount(6, $respuesta->json('paths.0.milestones'));
        $this->assertSame(
            18,
            collect($respuesta->json('paths.0.milestones'))->sum(fn (array $hito): int => count($hito['experiences'])),
        );
    }

    public function test_published_version_cannot_be_mutated_through_the_authoring_api(): void
    {
        $version = $this->datosCurso['version'];
        $ruta = $this->datosCurso['ruta'];
        $hito = $ruta->hitos()->orderBy('orden')->first();
        $experiencia = $hito->experiencias()->orderBy('orden')->first();

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/versiones/{$version->id}", [
                'titulo' => 'Intento de mutación',
                'audiencia' => 'TEENS',
                'etapa' => 'inicial',
            ])
            ->assertStatus(409);

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hito->id}", ['titulo' => 'Hito mutado'])
            ->assertStatus(409);

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$experiencia->id}", ['titulo' => 'Experiencia mutada'])
            ->assertStatus(409);

        $this->actingAs($this->docente)
            ->deleteJson("/api/v1/academico/experiencias/{$experiencia->id}")
            ->assertStatus(409);

        $this->assertSame('IA_ORIGEN_TEENS_2026_V1', $version->fresh()->titulo);
        $this->assertSame($hito->titulo, $hito->fresh()->titulo);
        $this->assertSame($experiencia->titulo, $experiencia->fresh()->titulo);
    }

    /* ------------------------------------------------------------------ */
    /* Clonado a borrador                                                  */
    /* ------------------------------------------------------------------ */

    public function test_draft_version_is_cloned_from_the_published_version_without_touching_it(): void
    {
        $version = $this->datosCurso['version'];

        $respuesta = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/studio/versiones/{$version->id}/borrador", []);

        $respuesta->assertCreated();
        $borrador = VersionCurso::findOrFail($respuesta->json('version.id'));

        $this->assertSame('draft', $borrador->estado);
        $this->assertSame(2, $borrador->numero);
        $this->assertSame('IA_ORIGEN_TEENS_2026_V2', $borrador->titulo);
        $this->assertSame($version->id, $borrador->id_version_origen);
        $this->assertSame($this->docente->id, $borrador->id_autor);
        $this->assertTrue($respuesta->json('editable'));

        // V1 intacta.
        $this->assertSame('published', $version->fresh()->estado);
        $this->assertSame('IA_ORIGEN_TEENS_2026_V1', $version->fresh()->titulo);

        // El árbol completo viajó al borrador.
        $hitos = $respuesta->json('paths.0.milestones');
        $this->assertCount(6, $hitos);
        $this->assertSame(18, collect($hitos)->sum(fn (array $hito): int => count($hito['experiences'])));
        $this->assertSame(6, count($respuesta->json('units')));

        // Prerrequisitos remapeados dentro de la nueva ruta.
        $idsHito = collect($hitos)->pluck('id')->all();
        $this->assertSame([$idsHito[0]], $hitos[1]['prerequisiteIds']);
        $this->assertSame([], $hitos[0]['prerequisiteIds']);

        // Los objetivos AI-01..AI-06 siguen asociados.
        $codigos = collect($hitos)
            ->flatMap(fn (array $hito): array => $hito['experiences'])
            ->flatMap(fn (array $experiencia): array => array_column($experiencia['objectives'], 'code'))
            ->unique()
            ->sort()
            ->values()
            ->all();
        $this->assertSame(['AI-01', 'AI-02', 'AI-03', 'AI-04', 'AI-05', 'AI-06'], $codigos);

        // Ninguna experiencia del borrador comparte identidad con V1.
        $rutaOrigen = $this->datosCurso['ruta']->fresh('hitos.experiencias');
        $idsOrigen = $rutaOrigen->hitos->flatMap->experiencias->pluck('id')->all();
        $idsBorrador = collect($hitos)->flatMap(fn (array $hito): array => array_column($hito['experiences'], 'id'))->all();
        $this->assertEmpty(array_intersect($idsOrigen, $idsBorrador));
    }

    public function test_lesson_sourced_experiences_are_remapped_to_the_cloned_lessons(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $idsLeccionOriginal = $this->datosCurso['version']->unidades()
            ->with('lecciones')->get()->flatMap->lecciones->pluck('id')->all();

        $experiencias = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))
            ->where('origen_tipo', 'leccion')
            ->get();

        $this->assertGreaterThan(0, $experiencias->count());
        foreach ($experiencias as $experiencia) {
            $this->assertNotNull($experiencia->origen_id);
            $this->assertNotContains($experiencia->origen_id, $idsLeccionOriginal);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Autoría sobre el borrador                                           */
    /* ------------------------------------------------------------------ */

    public function test_draft_metadata_milestone_and_experience_can_be_authored(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/versiones/{$borrador->id}", [
                'titulo' => 'IA_ORIGEN_TEENS_2026_V2',
                'descripcion' => 'Segunda edición revisada con el equipo docente.',
                'audiencia' => 'TEENS',
                'etapa' => 'intermedia',
            ])
            ->assertOk();

        $this->assertSame('intermedia', $borrador->fresh()->etapa->value);

        $hito = $ruta->hitos()->orderBy('orden')->first();
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hito->id}", [
                'titulo' => '¿La IA piensa? (revisado)',
                'descripcion' => 'Versión revisada del primer hito.',
            ])
            ->assertOk();

        $this->assertSame('¿La IA piensa? (revisado)', $hito->fresh()->titulo);

        $objetivo = $this->datosCurso['objetivos']['AI-02'];
        $creada = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/hitos/{$hito->id}/experiencias", [
                'tipo' => TipoExperienciaAprendizaje::PRACTICA->value,
                'titulo' => 'Práctica extra de especificación',
                'descripcion' => 'Refuerzo de los seis componentes de una instrucción.',
                'orden' => 4,
                'obligatoria' => false,
                'permite_intentos' => true,
                'regla_completitud' => ['modo' => 'submission'],
                'objetivos' => [$objetivo->id],
                'guia_entrega' => [
                    'instrucciones' => 'Entrega tu instrucción reescrita.',
                    'evidencia' => [
                        'modalidades' => [ModalidadEvidencia::TEXTO->value, ModalidadEvidencia::IMAGEN->value],
                        'obligatoria' => true,
                        'minimo_artefactos' => 1,
                    ],
                ],
                'contenido' => [
                    'summary' => 'Refuerzo breve.',
                    'blocks' => [
                        ['type' => 'concepto', 'text' => 'Una instrucción verificable declara criterios de éxito.'],
                        ['type' => 'pasos', 'title' => 'Cómo entregar', 'itemsKey' => 'pasos', 'items' => ['Reescribe', 'Compara', 'Justifica']],
                        ['type' => 'criterios_exito', 'title' => 'Éxito', 'items' => ['La instrucción declara criterios verificables.']],
                    ],
                ],
            ])
            ->assertCreated();

        $experiencia = ExperienciaAprendizaje::findOrFail($creada->json('id'));

        // La descripción, el contenido y la guía de entrega ya no se pierden.
        $this->assertSame('Refuerzo de los seis componentes de una instrucción.', $experiencia->descripcion);
        $this->assertSame('leccion_estructurada', $experiencia->contenido['tipo']);
        $this->assertCount(3, $experiencia->contenido['bloques']);
        // La clave de lista declarada se respeta; sin ella se usa la canónica.
        $this->assertSame(['Reescribe', 'Compara', 'Justifica'], $experiencia->contenido['bloques'][1]['pasos']);
        $this->assertSame(['La instrucción declara criterios verificables.'], $experiencia->contenido['bloques'][2]['elementos']);
        $this->assertSame(['text', 'image'], $experiencia->guia_entrega['evidencia']['modalidades']);
        $this->assertSame([$objetivo->id], $experiencia->objetivos->pluck('id')->all());

        // Actualización parcial.
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$experiencia->id}", ['titulo' => 'Práctica extra (v2)'])
            ->assertOk();

        $this->assertSame('Práctica extra (v2)', $experiencia->fresh()->titulo);
        $this->assertSame('submission', $experiencia->fresh()->regla_completitud['modo']);
    }

    public function test_all_seven_canonical_experience_types_can_be_authored(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $hito = $ruta->hitos()->orderBy('orden')->first();
        $orden = 10;

        foreach (TipoExperienciaAprendizaje::values() as $tipo) {
            $this->actingAs($this->docente)
                ->postJson("/api/v1/academico/hitos/{$hito->id}/experiencias", [
                    'tipo' => $tipo,
                    'titulo' => "Experiencia {$tipo}",
                    'orden' => $orden++,
                    'obligatoria' => false,
                    'regla_completitud' => ['modo' => 'submission'],
                ])
                ->assertCreated()
                ->assertJsonPath('tipo', $tipo);
        }

        $this->assertSame(
            ['desafio', 'evaluacion', 'laboratorio', 'leccion', 'mision', 'practica', 'proyecto'],
            ExperienciaAprendizaje::where('id_hito', $hito->id)
                ->where('orden', '>=', 10)
                ->pluck('tipo')
                ->map(fn ($tipo) => $tipo->value)
                ->sort()
                ->values()
                ->all(),
        );
    }

    public function test_objectives_can_be_authored_and_linked_to_experiences(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $experiencia = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))->firstOrFail();

        $creado = $this->actingAs($this->docente)
            ->postJson('/api/v1/academico/objetivos', [
                'id_institucion' => $this->institucion->id,
                'codigo' => 'AI-07',
                'descripcion' => 'Comunicar límites y riesgos de una solución asistida por IA.',
                'marco' => 'DAEMON_ARC',
                'nivel' => 'TEENS',
            ])
            ->assertCreated();

        $objetivoId = $creado->json('id');

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/objetivos/{$objetivoId}", [
                'codigo' => 'AI-07',
                'descripcion' => 'Comunicar límites, riesgos y supuestos de una solución asistida por IA.',
            ])
            ->assertOk()
            ->assertJsonPath('descripcion', 'Comunicar límites, riesgos y supuestos de una solución asistida por IA.');

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$experiencia->id}/objetivos", ['objetivos' => [$objetivoId]])
            ->assertOk();

        $this->assertSame([$objetivoId], $experiencia->fresh()->objetivos->pluck('id')->all());

        $listado = $this->actingAs($this->docente)->getJson('/api/v1/academico/objetivos')->assertOk();
        $this->assertContains('AI-07', array_column($listado->json('data'), 'codigo'));
    }

    public function test_evidence_and_rubric_configuration_is_persisted_and_read_back_canonically(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $capstone = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))
            ->where('tipo', TipoExperienciaAprendizaje::PROYECTO->value)
            ->get()
            ->firstOrFail(fn (ExperienciaAprendizaje $experiencia): bool => isset($experiencia->guia_entrega['rubrica_referencia']));

        // La rúbrica heredada (lista plana) se lee ya como rúbrica canónica.
        $detallePrevio = $this->detalleExperiencia($borrador, $capstone->id);
        $this->assertTrue($detallePrevio['rubric']['legacy']);
        $this->assertCount(9, $detallePrevio['rubric']['criteria']);

        $guia = $capstone->guia_entrega;
        $guia['evidencia'] = [
            'modalidades' => ['structured', 'image', 'pdf', 'external_link'],
            'obligatoria' => true,
            'minimo_artefactos' => 2,
            'notas' => 'Adjunta el artefacto y el enlace público de tu solución.',
        ];
        $guia['rubrica'] = [
            'titulo' => 'Rúbrica formativa del capstone',
            'criterios' => [
                ['codigo' => 'C1', 'titulo' => 'Definición del problema', 'descripcion' => 'El problema y su usuario son concretos.'],
                ['codigo' => 'C2', 'titulo' => 'Diseño del rol humano–IA', 'descripcion' => 'Queda claro qué decide la persona.'],
                ['codigo' => 'C3', 'titulo' => 'Verificación factual', 'descripcion' => 'Las afirmaciones fueron contrastadas.'],
            ],
        ];

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$capstone->id}", ['guia_entrega' => $guia])
            ->assertOk();

        $detalle = $this->detalleExperiencia($borrador, $capstone->id);

        $this->assertSame(['structured', 'image', 'pdf', 'external_link'], $detalle['evidence']['modalities']);
        $this->assertTrue($detalle['evidence']['required']);
        $this->assertSame(2, $detalle['evidence']['minimumArtifacts']);
        $this->assertFalse($detalle['rubric']['legacy']);
        $this->assertSame('Rúbrica formativa del capstone', $detalle['rubric']['title']);
        $this->assertCount(3, $detalle['rubric']['criteria']);

        // La forma heredada se retira al escribir la canónica: una sola verdad.
        $this->assertArrayNotHasKey('rubrica_referencia', $capstone->fresh()->guia_entrega);
        // Las claves pedagógicas históricas sobreviven.
        $this->assertArrayHasKey('instrucciones', $capstone->fresh()->guia_entrega);
    }

    public function test_invalid_evidence_modality_is_rejected(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $experiencia = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))->firstOrFail();

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$experiencia->id}", [
                'guia_entrega' => ['evidencia' => ['modalidades' => ['video_tiktok']]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guia_entrega');
    }

    public function test_human_review_requirement_is_derived_by_type_and_can_be_overridden(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $mision = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))
            ->where('tipo', TipoExperienciaAprendizaje::MISION->value)
            ->firstOrFail();

        $derivado = $this->detalleExperiencia($borrador, $mision->id);
        $this->assertTrue($derivado['review']['required']);
        $this->assertSame('derivedFromType', $derivado['review']['source']);

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$mision->id}", [
                'regla_completitud' => ['modo' => 'submission', 'revision_humana' => false],
            ])
            ->assertOk();

        $explicito = $this->detalleExperiencia($borrador, $mision->id);
        $this->assertFalse($explicito['review']['required']);
        $this->assertSame('explicit', $explicito['review']['source']);
    }

    public function test_dependencies_can_be_configured_and_cycles_are_rejected(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $hitos = $ruta->hitos()->orderBy('orden')->get();

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hitos[2]->id}/prerrequisitos", [
                'prerrequisitos' => [$hitos[0]->id, $hitos[1]->id],
            ])
            ->assertOk();

        $this->assertEqualsCanonicalizing(
            [$hitos[0]->id, $hitos[1]->id],
            $hitos[2]->fresh('prerrequisitos')->prerrequisitos->pluck('id')->all(),
        );

        // Ciclo: M1 pasaría a depender de M2, que ya depende de M1.
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hitos[0]->id}/prerrequisitos", [
                'prerrequisitos' => [$hitos[1]->id],
            ])
            ->assertStatus(422);

        $this->assertSame([], $hitos[0]->fresh('prerrequisitos')->prerrequisitos->pluck('id')->all());

        // Auto-dependencia.
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hitos[0]->id}/prerrequisitos", [
                'prerrequisitos' => [$hitos[0]->id],
            ])
            ->assertStatus(422);

        // Prerrequisito de otra ruta.
        $ajena = RutaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $this->institucion->id,
            'titulo' => 'Ruta ajena',
            'audiencia' => 'TEENS',
            'etapa' => 'inicial',
            'estado' => 'draft',
        ]);
        $hitoAjeno = HitoAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_ruta' => $ajena->id,
            'titulo' => 'Hito ajeno',
            'orden' => 1,
            'obligatorio' => true,
        ]);

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hitos[0]->id}/prerrequisitos", [
                'prerrequisitos' => [$hitoAjeno->id],
            ])
            ->assertStatus(422);
    }

    /* ------------------------------------------------------------------ */
    /* Validación de publicación                                           */
    /* ------------------------------------------------------------------ */

    public function test_cloned_draft_is_publication_ready(): void
    {
        $borrador = $this->clonarBorrador();

        $respuesta = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$borrador->id}/validacion")
            ->assertOk();

        $this->assertTrue($respuesta->json('ready'), json_encode($respuesta->json('errors')));
        $this->assertSame([], $respuesta->json('errors'));
    }

    public function test_validation_reports_structural_errors_and_blocks_publication(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $hito = $ruta->hitos()->orderBy('orden')->first();

        // Un hito obligatorio se queda sin experiencias obligatorias.
        ExperienciaAprendizaje::where('id_hito', $hito->id)->get()->each(function (ExperienciaAprendizaje $experiencia): void {
            $experiencia->update(['obligatoria' => false]);
        });

        $validacion = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$borrador->id}/validacion")
            ->assertOk();

        $this->assertFalse($validacion->json('ready'));
        $this->assertContains('milestone.no_required_experience', array_column($validacion->json('errors'), 'code'));

        $publicacion = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/studio/versiones/{$borrador->id}/publicacion")
            ->assertStatus(422);

        $this->assertFalse($publicacion->json('validation.ready'));
        $this->assertSame('draft', $borrador->fresh()->estado);
    }

    public function test_validation_reports_a_prerequisite_cycle_written_directly_to_the_domain(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $hitos = $ruta->hitos()->orderBy('orden')->get();

        // Escritura directa: la validación de publicación debe detectar el ciclo
        // aunque no haya pasado por el endpoint de prerrequisitos.
        $hitos[0]->prerrequisitos()->attach($hitos[1]->id);

        $validacion = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$borrador->id}/validacion")
            ->assertOk();

        $this->assertFalse($validacion->json('ready'));
        $this->assertContains('path.prerequisite_cycle', array_column($validacion->json('errors'), 'code'));
    }

    public function test_validation_reports_an_objective_from_another_institution(): void
    {
        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $experiencia = ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos()->pluck('id'))->firstOrFail();

        $otra = Institucion::create(['nombre' => 'Otra Escuela', 'slug' => 'otra-escuela']);
        $objetivoAjeno = \App\Models\ObjetivoAprendizaje::create([
            'id_institucion' => $otra->id,
            'uuid' => (string) Str::uuid(),
            'codigo' => 'XX-01',
            'descripcion' => 'Objetivo de otra institución.',
        ]);

        // La API canónica ya lo rechaza…
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/experiencias/{$experiencia->id}/objetivos", ['objetivos' => [$objetivoAjeno->id]])
            ->assertStatus(422);

        // …y si la referencia entrara por otra vía, la validación la detecta.
        $experiencia->objetivos()->attach($objetivoAjeno->id);

        $validacion = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$borrador->id}/validacion")
            ->assertOk();

        $this->assertFalse($validacion->json('ready'));
        $this->assertContains('experience.objective_invalid', array_column($validacion->json('errors'), 'code'));
    }

    public function test_validation_warns_when_a_submission_experience_declares_no_evidence(): void
    {
        $borrador = $this->clonarBorrador();

        $validacion = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$borrador->id}/validacion")
            ->assertOk();

        // IA: Origen V1 no declara modalidades canónicas todavía: son avisos,
        // no errores, y no bloquean la publicación.
        $this->assertTrue($validacion->json('ready'));
        $this->assertContains('experience.evidence_unconfigured', array_column($validacion->json('warnings'), 'code'));
    }

    /* ------------------------------------------------------------------ */
    /* Publicación e inmutabilidad                                         */
    /* ------------------------------------------------------------------ */

    public function test_draft_is_published_and_becomes_immutable_while_v1_and_enrollments_are_untouched(): void
    {
        $version = $this->datosCurso['version'];
        $rutaV1 = $this->datosCurso['ruta'];

        $alumnoV1 = $this->crearUsuario('alumno', $this->institucion, 'matias-v1');
        $matricula = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_version_curso' => $version->id,
            'id_ruta_aprendizaje' => $rutaV1->id,
            'id_usuario' => $alumnoV1->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);

        $borrador = $this->clonarBorrador();
        $rutaV2 = $borrador->rutas()->firstOrFail();

        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/versiones/{$borrador->id}", [
                'titulo' => 'IA_ORIGEN_TEENS_2026_V2',
                'descripcion' => 'Segunda edición.',
                'audiencia' => 'TEENS',
                'etapa' => 'inicial',
            ])
            ->assertOk();

        $publicacion = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/studio/versiones/{$borrador->id}/publicacion")
            ->assertOk();

        $this->assertSame('published', $publicacion->json('version.status'));
        $this->assertFalse($publicacion->json('editable'));
        $this->assertSame($this->docente->id, $borrador->fresh()->id_publicador);
        $this->assertSame('published', $rutaV2->fresh()->estado);

        // V2 ya no se puede mutar.
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/versiones/{$borrador->id}", [
                'titulo' => 'Mutación posterior',
                'audiencia' => 'TEENS',
                'etapa' => 'inicial',
            ])
            ->assertStatus(409);

        $hitoV2 = $rutaV2->hitos()->orderBy('orden')->first();
        $this->actingAs($this->docente)
            ->putJson("/api/v1/academico/hitos/{$hitoV2->id}", ['titulo' => 'Mutación posterior'])
            ->assertStatus(409);

        // V1 sigue publicada, inmutable e independiente.
        $this->assertSame('published', $version->fresh()->estado);
        $this->assertSame('IA_ORIGEN_TEENS_2026_V1', $version->fresh()->titulo);
        $this->assertNotSame($version->id, $borrador->id);

        // Las matrículas existentes no migraron.
        $this->assertSame($version->id, $matricula->fresh()->id_version_curso);
        $this->assertSame($rutaV1->id, $matricula->fresh()->id_ruta_aprendizaje);

        // El aula tampoco cambió sola de versión.
        $this->assertSame($version->id, $this->aula->fresh()->id_version_curso);

        // El Learning Core sirve V2 con normalidad a una matrícula nueva.
        $alumnoV2 = $this->crearUsuario('alumno', $this->institucion, 'noa-v2');
        MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_version_curso' => $borrador->id,
            'id_ruta_aprendizaje' => $rutaV2->id,
            'id_usuario' => $alumnoV2->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);

        $mapa = $this->actingAs($alumnoV2)->getJson('/api/v1/alumno/aprender/mapa')->assertOk();
        $this->assertSame($borrador->id, $mapa->json('courseVersion.id'));
        $this->assertSame(18, $mapa->json('progress.requiredExperienceCount'));
    }

    public function test_publishing_a_version_does_not_touch_v1_attempt_history(): void
    {
        $version = $this->datosCurso['version'];
        $rutaV1 = $this->datosCurso['ruta'];

        $matricula = MatriculaAula::create([
            'sourced_id' => (string) Str::uuid(),
            'id_aula' => $this->aula->id,
            'id_version_curso' => $version->id,
            'id_ruta_aprendizaje' => $rutaV1->id,
            'id_usuario' => $this->alumno->id,
            'rol' => 'student',
            'es_principal' => true,
            'estado' => 'active',
        ]);

        // Progresión real: la lección troncal desbloquea el laboratorio.
        $hito = $rutaV1->hitos()->orderBy('orden')->first();
        $leccion = $hito->experiencias()->orderBy('orden')->firstOrFail();

        $this->actingAs($this->alumno)
            ->putJson("/api/v1/alumno/aprendizaje/lecciones/{$leccion->origen_id}/progreso", [
                'estado' => 'completed',
                'porcentaje' => 100,
            ])
            ->assertOk();

        $laboratorio = $hito->experiencias()->where('permite_intentos', true)->orderBy('orden')->firstOrFail();
        $intento = $this->actingAs($this->alumno)
            ->postJson("/api/v1/alumno/aprender/experiencias/{$laboratorio->id}/intentos", [
                'idempotency_key' => (string) Str::uuid(),
            ])
            ->assertCreated();
        $intentoId = $intento->json('id');

        $borrador = $this->clonarBorrador();
        $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/studio/versiones/{$borrador->id}/publicacion")
            ->assertOk();

        $this->assertDatabaseHas('intentos_aprendizaje', [
            'id' => $intentoId,
            'id_experiencia' => $laboratorio->id,
            'id_matricula' => $matricula->id,
        ]);
        $this->assertSame($version->id, $matricula->fresh()->id_version_curso);
    }

    /* ------------------------------------------------------------------ */
    /* Autorización                                                        */
    /* ------------------------------------------------------------------ */

    public function test_student_cannot_author_courses(): void
    {
        $version = $this->datosCurso['version'];

        $this->actingAs($this->alumno)->getJson('/api/v1/academico/studio/cursos')->assertStatus(403);
        $this->actingAs($this->alumno)->getJson("/api/v1/academico/studio/versiones/{$version->id}")->assertStatus(403);
        $this->actingAs($this->alumno)
            ->postJson("/api/v1/academico/studio/versiones/{$version->id}/borrador", [])
            ->assertStatus(403);
    }

    public function test_anonymous_cannot_author_courses(): void
    {
        $version = $this->datosCurso['version'];

        $this->getJson('/api/v1/academico/studio/cursos')->assertStatus(401);
        $this->getJson("/api/v1/academico/studio/versiones/{$version->id}")->assertStatus(401);
        $this->postJson("/api/v1/academico/studio/versiones/{$version->id}/borrador", [])->assertStatus(401);
        $this->postJson("/api/v1/academico/studio/versiones/{$version->id}/publicacion")->assertStatus(401);
    }

    public function test_teacher_from_another_institution_cannot_author_or_see_the_course(): void
    {
        $otra = Institucion::create(['nombre' => 'Otra Escuela', 'slug' => 'otra-escuela']);
        $ajeno = $this->crearUsuario('docente', $otra, 'docente-ajeno');
        $version = $this->datosCurso['version'];

        $listado = $this->actingAs($ajeno)->getJson('/api/v1/academico/studio/cursos')->assertOk();
        $this->assertSame([], $listado->json('courses'));

        $this->actingAs($ajeno)->getJson("/api/v1/academico/studio/versiones/{$version->id}")->assertStatus(403);
        $this->actingAs($ajeno)
            ->postJson("/api/v1/academico/studio/versiones/{$version->id}/borrador", [])
            ->assertStatus(403);

        $borrador = $this->clonarBorrador();
        $ruta = $borrador->rutas()->firstOrFail();
        $hito = $ruta->hitos()->orderBy('orden')->first();

        $this->actingAs($ajeno)->putJson("/api/v1/academico/hitos/{$hito->id}", ['titulo' => 'Robo'])->assertStatus(403);
        $this->actingAs($ajeno)
            ->postJson("/api/v1/academico/studio/versiones/{$borrador->id}/publicacion")
            ->assertStatus(403);
    }

    /* ------------------------------------------------------------------ */
    /* Catálogo canónico                                                   */
    /* ------------------------------------------------------------------ */

    public function test_catalog_exposes_the_canonical_authoring_vocabulary(): void
    {
        $respuesta = $this->actingAs($this->docente)
            ->getJson('/api/v1/academico/studio/catalogo')
            ->assertOk();

        $this->assertSame(TipoExperienciaAprendizaje::values(), $respuesta->json('experienceTypes'));
        $this->assertCount(7, $respuesta->json('experienceTypes'));
        $this->assertSame(ModalidadEvidencia::values(), $respuesta->json('evidenceModalities'));
        $this->assertSame(['TEENS', 'TODOS', 'KIDS'], array_values(array_intersect(['TEENS', 'TODOS', 'KIDS'], $respuesta->json('audiences'))));
        $this->assertSame(
            ['AI-01', 'AI-02', 'AI-03', 'AI-04', 'AI-05', 'AI-06'],
            array_column($respuesta->json('objectives'), 'code'),
        );
    }

    /* ------------------------------------------------------------------ */
    /* Ayudas                                                              */
    /* ------------------------------------------------------------------ */

    private function clonarBorrador(): VersionCurso
    {
        $version = $this->datosCurso['version'];

        $respuesta = $this->actingAs($this->docente)
            ->postJson("/api/v1/academico/studio/versiones/{$version->id}/borrador", [])
            ->assertCreated();

        return VersionCurso::with('rutas')->findOrFail($respuesta->json('version.id'));
    }

    private function detalleExperiencia(VersionCurso $version, int $experienciaId): array
    {
        $respuesta = $this->actingAs($this->docente)
            ->getJson("/api/v1/academico/studio/versiones/{$version->id}")
            ->assertOk();

        return collect($respuesta->json('paths'))
            ->flatMap(fn (array $ruta): array => $ruta['milestones'])
            ->flatMap(fn (array $hito): array => $hito['experiences'])
            ->firstWhere('id', $experienciaId);
    }

    private function crearUsuario(string $rol, Institucion $institucion, string $usuario): Usuario
    {
        return Usuario::create([
            'nombre_completo' => Str::headline($usuario),
            'usuario' => $usuario,
            'email' => "{$usuario}@daemon.test",
            'password_hash' => bcrypt('password123'),
            'rol' => $rol,
            'nivel' => 'TEENS',
            'id_institucion' => $institucion->id,
            'id_aula' => $rol === 'alumno' && $institucion->id === $this->institucion->id ? $this->aula->id : null,
        ]);
    }
}
