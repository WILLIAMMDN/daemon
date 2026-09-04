<?php

namespace App\Services\Academico;

use App\Enums\AudienciaAprendizaje;
use App\Enums\EtapaAprendizaje;
use App\Enums\ModalidadEvidencia;
use App\Enums\TipoExperienciaAprendizaje;
use App\Models\Curso;
use App\Models\ExperienciaAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\Leccion;
use App\Models\ObjetivoAprendizaje;
use App\Models\RutaAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Models\VersionCurso;
use App\Support\Academico\ContenidoEstructurado;
use App\Support\Academico\GuiaEntrega;
use App\Support\Autoria\AlcanceAutoria;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Course Operations / Studio — capa de aplicación de la autoría de cursos.
 *
 * Toda la regla de negocio vive aquí, del lado del servidor: clonado de
 * versiones, lectura canónica del árbol de autoría, validación de publicación y
 * publicación atómica. El cliente (hoy Angular, mañana un adaptador MCP) sólo
 * llama a la API canónica; ningún cliente necesita replicar estas reglas ni
 * tocar la base de datos.
 *
 * Las mutaciones finas (metadatos, hitos, experiencias, prerrequisitos) siguen
 * viviendo en LearningCoreAuthoringService, que es el dueño canónico del
 * Learning Core. Este servicio orquesta, no duplica.
 */
class ArcCourseStudioService
{
    public function __construct(private readonly LearningCoreAuthoringService $autoria) {}

    /**
     * Vocabulario canónico que un cliente de autoría necesita para construir
     * formularios sin hardcodear enums.
     */
    public function catalogo(Usuario $actor): array
    {
        return [
            'experienceTypes' => TipoExperienciaAprendizaje::values(),
            'audiences' => AudienciaAprendizaje::values(),
            'difficulties' => EtapaAprendizaje::values(),
            'evidenceModalities' => ModalidadEvidencia::values(),
            'artifactModalities' => ModalidadEvidencia::modalidadesDeArtefacto(),
            'completionModes' => ['manual_review', 'passing_score', 'submission', 'lesson_completion'],
            'contentBlockTypes' => ContenidoEstructurado::tiposDeBloque(),
            'experienceVariants' => ['boss'],
            'sourceTypes' => ['leccion', 'mision', 'evaluacion', 'proyecto', 'laboratorio', 'practica', 'desafio'],
            'objectiveLevels' => AudienciaAprendizaje::values(),
            'statuses' => ['draft', 'published', 'archived'],
            // Limites reales que aplica la validacion del servidor. Un cliente
            // de autoria (Studio o un adaptador MCP) los lee en vez de
            // adivinarlos, y un rechazo 422 deja de ser una sorpresa.
            'authoringConstraints' => [
                'titleMaxLength' => 150,
                'descriptionMaxLength' => 5000,
                'objectiveDescriptionMaxLength' => 2000,
                'orderMin' => 1,
                'orderMax' => 999,
                'maxAttemptsMax' => 100,
                'passingScoreMax' => 100,
                'maxObjectivesPerExperience' => 50,
                'maxPrerequisitesPerMilestone' => 100,
                'maxRubricCriteria' => 20,
                'maxContentBlocks' => 60,
                'maxEvidenceArtifacts' => 10,
                'evidenceNotesMaxLength' => 2000,
            ],
            // Modelo de capacidades del token. La publicacion es un alcance
            // aparte y deliberadamente humano: ningun cliente automatizado la
            // recibe, y la comprobacion vive en el servidor.
            'authoringScopes' => [
                'read' => AlcanceAutoria::LECTURA,
                'write' => AlcanceAutoria::ESCRITURA,
                'publish' => AlcanceAutoria::PUBLICACION,
                'serviceDefaults' => AlcanceAutoria::porDefectoMcp(),
            ],
            'publication' => [
                'requiredScope' => AlcanceAutoria::PUBLICACION,
                'humanReviewRequired' => true,
            ],
            // Identidad del actor autenticado. Un cliente headless no tiene
            // pantalla donde elegir institucion: la lee de aqui en vez de
            // adivinar un id.
            'actor' => [
                'id' => (int) $actor->id,
                'role' => $actor->rol,
                'institutionId' => $actor->id_institucion === null ? null : (int) $actor->id_institucion,
            ],
            'objectives' => $this->objetivos($actor)
                ->map(fn (ObjetivoAprendizaje $objetivo): array => $this->objetivoResumen($objetivo))
                ->values()
                ->all(),
        ];
    }

    /**
     * Cursos reales que el actor puede operar, con sus versiones.
     */
    public function cursos(Usuario $actor): array
    {
        abort_unless(in_array($actor->rol, ['docente', 'admin'], true), 403, 'Sólo un actor académico puede operar la autoría de cursos.');

        $cursos = Curso::query()
            ->when($actor->rol !== 'admin', fn ($consulta) => $consulta->where('id_institucion', $actor->id_institucion))
            ->with(['versiones.autor', 'versiones.publicador', 'versiones.rutas'])
            ->withCount(['versiones', 'aulas'])
            ->orderBy('titulo')
            ->get();

        return [
            'courses' => $cursos->map(fn (Curso $curso): array => $this->cursoResumen($curso))->values()->all(),
            'generatedAt' => CarbonImmutable::now('UTC')->toIso8601ZuluString(),
        ];
    }

    /**
     * Un curso con el detalle de sus versiones.
     */
    public function curso(Usuario $actor, Curso $curso): array
    {
        $this->autorizar($actor, (int) $curso->id_institucion);
        $curso->loadMissing(['versiones.autor', 'versiones.publicador', 'versiones.rutas'])
            ->loadCount(['versiones', 'aulas']);

        return [
            'course' => $this->cursoResumen($curso),
            'generatedAt' => CarbonImmutable::now('UTC')->toIso8601ZuluString(),
        ];
    }

    /**
     * Árbol completo de autoría de una versión: metadatos, unidades, ruta,
     * hitos, experiencias, objetivos, evidencia y rúbrica.
     */
    public function version(Usuario $actor, VersionCurso $version): array
    {
        $version->loadMissing([
            'curso',
            'autor',
            'publicador',
            'versionOrigen',
            'unidades.lecciones',
            'rutas.hitos.prerrequisitos',
            'rutas.hitos.experiencias.objetivos',
            'rutas.hitos.experiencias.unidad',
        ]);
        $this->autorizar($actor, (int) $version->curso->id_institucion);

        $editable = $version->estado === 'draft';

        return [
            'course' => [
                'id' => $version->curso->id,
                'title' => $version->curso->titulo,
                'code' => $version->curso->codigo,
                'level' => $version->curso->nivel,
                'status' => $version->curso->estado,
            ],
            'version' => $this->versionResumen($version),
            'editable' => $editable,
            'units' => $version->unidades->map(fn (UnidadCurso $unidad): array => [
                'id' => $unidad->id,
                'title' => $unidad->titulo,
                'description' => $unidad->descripcion,
                'order' => $unidad->orden,
                'status' => $unidad->estado,
                'lessons' => $unidad->lecciones->map(fn (Leccion $leccion): array => [
                    'id' => $leccion->id,
                    'title' => $leccion->titulo,
                    'order' => $leccion->orden,
                    'status' => $leccion->estado,
                ])->values()->all(),
            ])->values()->all(),
            'paths' => $version->rutas->map(fn (RutaAprendizaje $ruta): array => $this->rutaDetalle($ruta))->values()->all(),
            'objectives' => $this->objetivos($actor, (int) $version->curso->id_institucion)
                ->map(fn (ObjetivoAprendizaje $objetivo): array => $this->objetivoResumen($objetivo))
                ->values()
                ->all(),
            'validation' => $this->validar($actor, $version),
            'generatedAt' => CarbonImmutable::now('UTC')->toIso8601ZuluString(),
        ];
    }

    /**
     * Crea un nuevo borrador clonando una versión existente.
     *
     * V1 nunca se toca: se copia su árbol completo (unidades, lecciones, ruta,
     * hitos, experiencias, objetivos y prerrequisitos) hacia una versión nueva
     * en borrador. Las matrículas existentes siguen apuntando a su versión.
     */
    public function crearBorradorDesde(Usuario $actor, VersionCurso $origen, array $datos = []): VersionCurso
    {
        $origen->loadMissing(['curso', 'unidades.lecciones.objetivos', 'rutas.hitos.prerrequisitos', 'rutas.hitos.experiencias.objetivos']);
        $this->autorizar($actor, (int) $origen->curso->id_institucion);

        return DB::transaction(function () use ($actor, $origen, $datos): VersionCurso {
            $numero = (int) VersionCurso::where('id_curso', $origen->id_curso)->lockForUpdate()->max('numero') + 1;

            $version = VersionCurso::create([
                'uuid' => (string) Str::uuid(),
                'id_curso' => $origen->id_curso,
                'numero' => $numero,
                'titulo' => $datos['titulo'] ?? $this->siguienteTitulo($origen, $numero),
                'descripcion' => $datos['descripcion'] ?? $origen->descripcion,
                'audiencia' => $datos['audiencia'] ?? $origen->audiencia->value,
                'etapa' => $datos['etapa'] ?? $origen->etapa->value,
                'estado' => 'draft',
                'id_autor' => $actor->id,
                'id_version_origen' => $origen->id,
            ]);

            $mapaUnidades = [];
            $mapaLecciones = [];

            foreach ($origen->unidades as $unidad) {
                $copia = UnidadCurso::create([
                    'uuid' => (string) Str::uuid(),
                    'id_curso' => $version->id_curso,
                    'id_version_curso' => $version->id,
                    'titulo' => $unidad->titulo,
                    'descripcion' => $unidad->descripcion,
                    'orden' => $unidad->orden,
                    'estado' => 'draft',
                ]);
                $mapaUnidades[$unidad->id] = $copia->id;

                foreach ($unidad->lecciones as $leccion) {
                    $copiaLeccion = Leccion::create([
                        'uuid' => (string) Str::uuid(),
                        'id_unidad' => $copia->id,
                        'titulo' => $leccion->titulo,
                        'resumen' => $leccion->resumen,
                        'contenido' => $leccion->contenido,
                        'duracion_minutos' => $leccion->duracion_minutos,
                        'orden' => $leccion->orden,
                        'estado' => 'draft',
                    ]);
                    $copiaLeccion->objetivos()->sync($leccion->objetivos->pluck('id')->all());
                    $mapaLecciones[$leccion->id] = $copiaLeccion->id;
                }
            }

            foreach ($origen->rutas as $ruta) {
                $this->clonarRuta($ruta, $version, $mapaUnidades, $mapaLecciones);
            }

            return $version->fresh(['curso', 'unidades.lecciones', 'rutas.hitos.experiencias']);
        });
    }

    /**
     * Resultado de preparación para publicación. Es la autoridad: el frontend
     * puede previsualizar, pero esta respuesta es la que decide.
     *
     * @return array{versionId: int, ready: bool, errors: list<array<string, mixed>>, warnings: list<array<string, mixed>>, checkedAt: string}
     */
    public function validar(Usuario $actor, VersionCurso $version): array
    {
        $version->loadMissing([
            'curso',
            'unidades.lecciones',
            'rutas.hitos.prerrequisitos',
            'rutas.hitos.experiencias.objetivos',
        ]);
        $this->autorizar($actor, (int) $version->curso->id_institucion);

        $errores = [];
        $avisos = [];

        if ($version->estado !== 'draft') {
            $errores[] = $this->hallazgo('version.not_draft', 'version', 'Sólo una versión en borrador puede publicarse.', $version->id);
        }

        if (blank($version->titulo)) {
            $errores[] = $this->hallazgo('version.title_missing', 'version', 'La versión necesita un título.', $version->id);
        }

        if ($version->unidades->isEmpty()) {
            $errores[] = $this->hallazgo('version.no_units', 'version', 'La versión necesita al menos una unidad curricular.', $version->id);
        } elseif ($version->unidades->flatMap->lecciones->isEmpty()) {
            $errores[] = $this->hallazgo('version.no_lessons', 'version', 'La versión necesita al menos una lección.', $version->id);
        }

        if ($version->rutas->isEmpty()) {
            $errores[] = $this->hallazgo('path.missing', 'path', 'La versión necesita una ruta de aprendizaje.', $version->id);
        }

        $objetivosInstitucion = $this->objetivos($actor, (int) $version->curso->id_institucion)
            ->pluck('id')->map(fn ($id): int => (int) $id)->all();
        $idsUnidad = $version->unidades->pluck('id')->map(fn ($id): int => (int) $id)->all();

        foreach ($version->rutas as $ruta) {
            $this->validarRuta($ruta, $objetivosInstitucion, $idsUnidad, $errores, $avisos);
        }

        return [
            'versionId' => (int) $version->id,
            'ready' => $errores === [],
            'errors' => array_values($errores),
            'warnings' => array_values($avisos),
            'checkedAt' => CarbonImmutable::now('UTC')->toIso8601ZuluString(),
        ];
    }

    /**
     * Publica la versión y sus rutas en una sola transacción.
     *
     * La publicación es deliberada y humana: exige que la validación esté en
     * verde y devuelve 422 con los hallazgos exactos cuando no lo está.
     */
    public function publicar(Usuario $actor, VersionCurso $version): array
    {
        $validacion = $this->validar($actor, $version);

        if (! $validacion['ready']) {
            abort(response()->json([
                'message' => 'La versión no está lista para publicarse.',
                'validation' => $validacion,
            ], 422));
        }

        DB::transaction(function () use ($actor, $version): void {
            $this->autoria->publicarVersion($actor, $version);
            $version->refresh()->loadMissing('rutas');

            foreach ($version->rutas as $ruta) {
                if ($ruta->estado === 'draft') {
                    $this->autoria->publicarRuta($actor, $ruta->fresh());
                }
            }
        });

        return $this->version($actor, $version->fresh());
    }

    /**
     * Objetivos canónicos de una institución (por defecto la del actor).
     *
     * @return Collection<int, ObjetivoAprendizaje>
     */
    public function objetivos(Usuario $actor, ?int $institucionId = null): Collection
    {
        return ObjetivoAprendizaje::query()
            ->where('id_institucion', $institucionId ?? (int) $actor->id_institucion)
            ->orderBy('codigo')
            ->orderBy('id')
            ->get();
    }

    public function crearObjetivo(Usuario $actor, array $datos): ObjetivoAprendizaje
    {
        $institucion = (int) ($datos['id_institucion'] ?? $actor->id_institucion);
        $this->autorizar($actor, $institucion);

        return ObjetivoAprendizaje::create([
            ...$datos,
            'id_institucion' => $institucion,
            'uuid' => (string) Str::uuid(),
        ]);
    }

    public function actualizarObjetivo(Usuario $actor, ObjetivoAprendizaje $objetivo, array $datos): ObjetivoAprendizaje
    {
        $this->autorizar($actor, (int) $objetivo->id_institucion);
        unset($datos['id_institucion']);
        $objetivo->update($datos);

        return $objetivo->fresh();
    }

    /* ------------------------------------------------------------------ */
    /* Validación por ruta                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * @param  list<int>  $objetivosInstitucion
     * @param  list<int>  $idsUnidad
     * @param  list<array<string, mixed>>  $errores
     * @param  list<array<string, mixed>>  $avisos
     */
    private function validarRuta(RutaAprendizaje $ruta, array $objetivosInstitucion, array $idsUnidad, array &$errores, array &$avisos): void
    {
        if ($ruta->hitos->isEmpty()) {
            $errores[] = $this->hallazgo('path.no_milestones', 'path', "La ruta «{$ruta->titulo}» necesita al menos un hito.", $ruta->id);

            return;
        }

        $idsHito = $ruta->hitos->pluck('id')->map(fn ($id): int => (int) $id)->all();
        $grafo = [];

        foreach ($ruta->hitos as $hito) {
            $grafo[(int) $hito->id] = $hito->prerrequisitos->pluck('id')->map(fn ($id): int => (int) $id)->all();

            foreach ($grafo[(int) $hito->id] as $prerrequisito) {
                if ($prerrequisito === (int) $hito->id) {
                    $errores[] = $this->hallazgo('milestone.self_prerequisite', 'milestone', "El hito «{$hito->titulo}» depende de sí mismo.", $hito->id);
                } elseif (! in_array($prerrequisito, $idsHito, true)) {
                    $errores[] = $this->hallazgo('milestone.prerequisite_missing', 'milestone', "El hito «{$hito->titulo}» referencia un prerrequisito fuera de la ruta.", $hito->id);
                }
            }

            if (blank($hito->titulo)) {
                $errores[] = $this->hallazgo('milestone.title_missing', 'milestone', 'Un hito de la ruta no tiene título.', $hito->id);
            }

            if ($hito->experiencias->isEmpty()) {
                $errores[] = $this->hallazgo('milestone.no_experiences', 'milestone', "El hito «{$hito->titulo}» no tiene experiencias.", $hito->id);
            } elseif ($hito->obligatorio && $hito->experiencias->where('obligatoria', true)->isEmpty()) {
                $errores[] = $this->hallazgo('milestone.no_required_experience', 'milestone', "El hito obligatorio «{$hito->titulo}» necesita al menos una experiencia obligatoria.", $hito->id);
            }

            $ordenes = $hito->experiencias->pluck('orden')->map(fn ($orden): int => (int) $orden)->all();
            if (count($ordenes) !== count(array_unique($ordenes))) {
                $errores[] = $this->hallazgo('milestone.duplicate_experience_order', 'milestone', "El hito «{$hito->titulo}» tiene experiencias con el mismo orden.", $hito->id);
            }

            foreach ($hito->experiencias as $experiencia) {
                $this->validarExperiencia($experiencia, $objetivosInstitucion, $idsUnidad, $errores, $avisos);
            }
        }

        $ordenesHito = $ruta->hitos->pluck('orden')->map(fn ($orden): int => (int) $orden)->all();
        if (count($ordenesHito) !== count(array_unique($ordenesHito))) {
            $errores[] = $this->hallazgo('path.duplicate_milestone_order', 'path', "La ruta «{$ruta->titulo}» tiene hitos con el mismo orden.", $ruta->id);
        }

        if ($this->tieneCiclo($grafo)) {
            $errores[] = $this->hallazgo('path.prerequisite_cycle', 'path', "Los prerrequisitos de la ruta «{$ruta->titulo}» forman un ciclo.", $ruta->id);
        }
    }

    /**
     * @param  list<int>  $objetivosInstitucion
     * @param  list<int>  $idsUnidad
     * @param  list<array<string, mixed>>  $errores
     * @param  list<array<string, mixed>>  $avisos
     */
    private function validarExperiencia(ExperienciaAprendizaje $experiencia, array $objetivosInstitucion, array $idsUnidad, array &$errores, array &$avisos): void
    {
        $titulo = $experiencia->titulo;

        if (blank($titulo)) {
            $errores[] = $this->hallazgo('experience.title_missing', 'experience', 'Una experiencia no tiene título.', $experiencia->id);
        }

        if ($experiencia->id_unidad !== null && ! in_array((int) $experiencia->id_unidad, $idsUnidad, true)) {
            $errores[] = $this->hallazgo('experience.unit_invalid', 'experience', "La experiencia «{$titulo}» apunta a una unidad de otra versión.", $experiencia->id);
        }

        foreach ($experiencia->objetivos as $objetivo) {
            if (! in_array((int) $objetivo->id, $objetivosInstitucion, true)) {
                $errores[] = $this->hallazgo('experience.objective_invalid', 'experience', "La experiencia «{$titulo}» referencia un objetivo de otra institución.", $experiencia->id);
            }
        }

        foreach (GuiaEntrega::errores($experiencia->guia_entrega) as $error) {
            $errores[] = $this->hallazgo('experience.evidence_invalid', 'experience', "«{$titulo}»: {$error}", $experiencia->id);
        }

        if ($experiencia->objetivos->isEmpty()) {
            $avisos[] = $this->hallazgo('experience.no_objectives', 'experience', "La experiencia «{$titulo}» no está asociada a ningún objetivo.", $experiencia->id);
        }

        $modo = $experiencia->regla_completitud['modo'] ?? null;
        $evidencia = GuiaEntrega::evidencia($experiencia->guia_entrega);

        if (in_array($modo, ['submission', 'manual_review'], true) && $evidencia['modalities'] === []) {
            $avisos[] = $this->hallazgo('experience.evidence_unconfigured', 'experience', "La experiencia «{$titulo}» pide entrega pero no declara modalidades de evidencia.", $experiencia->id);
        }

        if ($modo === null) {
            $avisos[] = $this->hallazgo('experience.completion_rule_missing', 'experience', "La experiencia «{$titulo}» no declara regla de completitud.", $experiencia->id);
        }

        if (blank($experiencia->descripcion)) {
            $avisos[] = $this->hallazgo('experience.description_missing', 'experience', "La experiencia «{$titulo}» no tiene descripción para el estudiante.", $experiencia->id);
        }
    }

    /**
     * @param  array<int, list<int>>  $grafo
     */
    private function tieneCiclo(array $grafo): bool
    {
        $estado = [];
        $ciclo = false;

        $visitar = function (int $nodo) use (&$visitar, &$estado, &$ciclo, $grafo): void {
            if ($ciclo || ($estado[$nodo] ?? 0) === 2) {
                return;
            }
            if (($estado[$nodo] ?? 0) === 1) {
                $ciclo = true;

                return;
            }
            $estado[$nodo] = 1;
            foreach ($grafo[$nodo] ?? [] as $dependencia) {
                if (array_key_exists($dependencia, $grafo)) {
                    $visitar($dependencia);
                }
            }
            $estado[$nodo] = 2;
        };

        foreach (array_keys($grafo) as $nodo) {
            $visitar($nodo);
        }

        return $ciclo;
    }

    /* ------------------------------------------------------------------ */
    /* Serialización                                                       */
    /* ------------------------------------------------------------------ */

    private function cursoResumen(Curso $curso): array
    {
        $versiones = $curso->versiones->sortBy('numero')->values();

        return [
            'id' => (int) $curso->id,
            'title' => $curso->titulo,
            'code' => $curso->codigo,
            'description' => $curso->descripcion,
            'audience' => $curso->nivel,
            'status' => $curso->estado,
            'versionCount' => (int) ($curso->versiones_count ?? $versiones->count()),
            'cohortCount' => (int) ($curso->aulas_count ?? 0),
            'publishedVersion' => $versiones->firstWhere('estado', 'published')
                ? $this->versionResumen($versiones->where('estado', 'published')->sortByDesc('numero')->first())
                : null,
            'draftVersion' => $versiones->where('estado', 'draft')->sortByDesc('numero')->first()
                ? $this->versionResumen($versiones->where('estado', 'draft')->sortByDesc('numero')->first())
                : null,
            'versions' => $versiones->map(fn (VersionCurso $version): array => $this->versionResumen($version))->values()->all(),
        ];
    }

    private function versionResumen(VersionCurso $version): array
    {
        return [
            'id' => (int) $version->id,
            'uuid' => $version->uuid,
            'courseId' => (int) $version->id_curso,
            'number' => (int) $version->numero,
            'title' => $version->titulo,
            'description' => $version->descripcion,
            'audience' => $version->audiencia?->value,
            'difficulty' => $version->etapa?->value,
            'status' => $version->estado,
            'editable' => $version->estado === 'draft',
            'publishedAt' => $version->publicado_at?->toIso8601ZuluString(),
            'archivedAt' => $version->archivado_at?->toIso8601ZuluString(),
            'createdAt' => $version->created_at?->toIso8601ZuluString(),
            'updatedAt' => $version->updated_at?->toIso8601ZuluString(),
            'clonedFromVersionId' => $version->id_version_origen ? (int) $version->id_version_origen : null,
            'author' => $version->relationLoaded('autor') && $version->autor
                ? ['id' => (int) $version->autor->id, 'name' => $version->autor->nombre_completo]
                : null,
            'publisher' => $version->relationLoaded('publicador') && $version->publicador
                ? ['id' => (int) $version->publicador->id, 'name' => $version->publicador->nombre_completo]
                : null,
            'pathCount' => $version->relationLoaded('rutas') ? $version->rutas->count() : null,
        ];
    }

    private function rutaDetalle(RutaAprendizaje $ruta): array
    {
        return [
            'id' => (int) $ruta->id,
            'title' => $ruta->titulo,
            'description' => $ruta->descripcion,
            'audience' => $ruta->audiencia?->value,
            'difficulty' => $ruta->etapa?->value,
            'status' => $ruta->estado,
            'editable' => $ruta->estado === 'draft',
            'milestones' => $ruta->hitos->map(fn (HitoAprendizaje $hito): array => [
                'id' => (int) $hito->id,
                'title' => $hito->titulo,
                'description' => $hito->descripcion,
                'order' => (int) $hito->orden,
                'required' => (bool) $hito->obligatorio,
                'prerequisiteIds' => $hito->prerrequisitos->pluck('id')->map(fn ($id): int => (int) $id)->values()->all(),
                'experiences' => $hito->experiencias
                    ->map(fn (ExperienciaAprendizaje $experiencia): array => $this->experienciaDetalle($experiencia))
                    ->values()
                    ->all(),
            ])->values()->all(),
        ];
    }

    private function experienciaDetalle(ExperienciaAprendizaje $experiencia): array
    {
        $reglas = $experiencia->regla_completitud ?? [];

        return [
            'id' => (int) $experiencia->id,
            'uuid' => $experiencia->uuid,
            'milestoneId' => (int) $experiencia->id_hito,
            'unitId' => $experiencia->id_unidad ? (int) $experiencia->id_unidad : null,
            'type' => $experiencia->tipo?->value,
            'variant' => $experiencia->variante,
            'title' => $experiencia->titulo,
            'description' => $experiencia->descripcion,
            'order' => (int) $experiencia->orden,
            'required' => (bool) $experiencia->obligatoria,
            'attemptable' => (bool) $experiencia->permite_intentos,
            'maxAttempts' => $experiencia->max_intentos !== null ? (int) $experiencia->max_intentos : null,
            'sourceType' => $experiencia->origen_tipo,
            'sourceId' => $experiencia->origen_id !== null ? (int) $experiencia->origen_id : null,
            'status' => $experiencia->estado,
            'completion' => [
                'mode' => $reglas['modo'] ?? null,
                'passingScore' => isset($reglas['puntaje_minimo']) ? (float) $reglas['puntaje_minimo'] : null,
            ],
            'review' => [
                'required' => LearningProgressionService::exigeRevisionHumana($experiencia),
                'source' => array_key_exists('revision_humana', $reglas) ? 'explicit' : 'derivedFromType',
            ],
            'evidence' => GuiaEntrega::evidencia($experiencia->guia_entrega),
            'rubric' => GuiaEntrega::rubrica($experiencia->guia_entrega),
            'deliveryGuide' => $experiencia->guia_entrega,
            'content' => ContenidoEstructurado::leer($experiencia->contenido),
            'objectiveIds' => $experiencia->objetivos->pluck('id')->map(fn ($id): int => (int) $id)->values()->all(),
            'objectives' => $experiencia->objetivos
                ->map(fn (ObjetivoAprendizaje $objetivo): array => $this->objetivoResumen($objetivo))
                ->values()
                ->all(),
        ];
    }

    private function objetivoResumen(ObjetivoAprendizaje $objetivo): array
    {
        return [
            'id' => (int) $objetivo->id,
            'code' => $objetivo->codigo,
            'description' => $objetivo->descripcion,
            'framework' => $objetivo->marco,
            'level' => $objetivo->nivel,
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Clonado                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * @param  array<int, int>  $mapaUnidades
     * @param  array<int, int>  $mapaLecciones
     */
    private function clonarRuta(RutaAprendizaje $ruta, VersionCurso $version, array $mapaUnidades, array $mapaLecciones): void
    {
        $copia = RutaAprendizaje::create([
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $ruta->id_institucion,
            'id_curso' => $version->id_curso,
            'id_version_curso' => $version->id,
            'titulo' => $ruta->titulo,
            'descripcion' => $ruta->descripcion,
            'audiencia' => $ruta->audiencia->value,
            'etapa' => $ruta->etapa->value,
            'estado' => 'draft',
        ]);

        $mapaHitos = [];

        foreach ($ruta->hitos as $hito) {
            $copiaHito = HitoAprendizaje::create([
                'uuid' => (string) Str::uuid(),
                'id_ruta' => $copia->id,
                'titulo' => $hito->titulo,
                'descripcion' => $hito->descripcion,
                'orden' => $hito->orden,
                'obligatorio' => $hito->obligatorio,
                'requisitos_completitud' => $hito->requisitos_completitud,
            ]);
            $mapaHitos[$hito->id] = $copiaHito->id;

            foreach ($hito->experiencias as $experiencia) {
                $copiaExperiencia = ExperienciaAprendizaje::create([
                    'uuid' => (string) Str::uuid(),
                    'id_hito' => $copiaHito->id,
                    'id_unidad' => $mapaUnidades[$experiencia->id_unidad] ?? null,
                    'tipo' => $experiencia->tipo->value,
                    'variante' => $experiencia->variante,
                    'titulo' => $experiencia->titulo,
                    'descripcion' => $experiencia->descripcion,
                    'contenido' => $experiencia->contenido,
                    // El origen se remapea al clon; si apuntaba a una lección de
                    // V1 debe apuntar a la lección equivalente de la nueva versión.
                    'origen_tipo' => $experiencia->origen_tipo,
                    'origen_id' => $experiencia->origen_tipo === 'leccion'
                        ? ($mapaLecciones[$experiencia->origen_id] ?? null)
                        : $experiencia->origen_id,
                    'orden' => $experiencia->orden,
                    'obligatoria' => $experiencia->obligatoria,
                    'permite_intentos' => $experiencia->permite_intentos,
                    'max_intentos' => $experiencia->max_intentos,
                    'regla_completitud' => $experiencia->regla_completitud,
                    'guia_entrega' => $experiencia->guia_entrega,
                    'estado' => 'draft',
                ]);
                $copiaExperiencia->objetivos()->sync($experiencia->objetivos->pluck('id')->all());
            }
        }

        foreach ($ruta->hitos as $hito) {
            $prerrequisitos = $hito->prerrequisitos
                ->map(fn (HitoAprendizaje $prerrequisito) => $mapaHitos[$prerrequisito->id] ?? null)
                ->filter()
                ->values()
                ->all();

            if ($prerrequisitos !== []) {
                HitoAprendizaje::findOrFail($mapaHitos[$hito->id])->prerrequisitos()->sync($prerrequisitos);
            }
        }
    }

    private function siguienteTitulo(VersionCurso $origen, int $numero): ?string
    {
        if (blank($origen->titulo)) {
            return null;
        }

        $base = preg_replace('/_V\d+$/', '', (string) $origen->titulo);

        return $base === $origen->titulo ? "{$origen->titulo} (V{$numero})" : "{$base}_V{$numero}";
    }

    /* ------------------------------------------------------------------ */
    /* Autorización                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Misma frontera que LearningCoreAuthoringService: la autoría es
     * institucional y un admin opera cualquier institución.
     */
    private function autorizar(Usuario $actor, int $institucionId): void
    {
        abort_unless(in_array($actor->rol, ['docente', 'admin'], true), 403, 'Sólo un actor académico puede operar la autoría de cursos.');

        if ($actor->rol !== 'admin') {
            abort_unless((int) $actor->id_institucion === $institucionId, 403, 'No puedes administrar cursos de otra institución.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function hallazgo(string $codigo, string $ambito, string $mensaje, int|string|null $objetivo = null): array
    {
        return ['code' => $codigo, 'scope' => $ambito, 'message' => $mensaje, 'targetId' => $objetivo !== null ? (int) $objetivo : null];
    }
}
