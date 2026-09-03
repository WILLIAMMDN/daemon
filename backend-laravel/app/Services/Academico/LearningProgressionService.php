<?php

namespace App\Services\Academico;

use App\Enums\AudienciaAprendizaje;
use App\Enums\TipoExperienciaAprendizaje;
use App\Models\ExperienciaAprendizaje;
use App\Models\FeedbackAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\IntentoAprendizaje;
use App\Models\MatriculaAula;
use App\Models\ProgresoExperiencia;
use App\Models\RutaAprendizaje;
use App\Models\Usuario;
use App\Services\Eventos\OutboxService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LearningProgressionService
{
    public function __construct(private readonly OutboxService $outbox) {}

    public function mapa(Usuario $alumno): array
    {
        $contexto = $this->resolverContexto($alumno);
        if (! $contexto) {
            return $this->mapaVacio();
        }

        /** @var MatriculaAula $matricula */
        $matricula = $contexto['matricula'];
        /** @var RutaAprendizaje|null $ruta */
        $ruta = $contexto['ruta'];
        if (! $ruta) {
            return [
                ...$this->mapaVacio(),
                'enrollment' => $this->matriculaResumen($matricula),
                'courseVersion' => $this->versionResumen($contexto['version']),
                'legacyFallback' => true,
            ];
        }

        $ruta->load([
            'hitos.prerrequisitos:id',
            'hitos.experiencias.objetivos:id,codigo,descripcion',
            'hitos.experiencias.progresos' => fn ($query) => $query->where('id_matricula', $matricula->id)->with('intentoCompletado.feedback'),
            'hitos.experiencias.intentos' => fn ($query) => $query
                ->where('id_matricula', $matricula->id)
                ->with(['evidencias', 'feedback'])
                ->orderBy('numero'),
        ]);
        $completitudHitos = $ruta->hitos->mapWithKeys(fn (HitoAprendizaje $hito): array => [
            $hito->id => $this->hitoCompletado($hito),
        ]);
        $actualEncontrado = false;
        $completadas = 0;
        $requeridas = 0;
        $hitos = $ruta->hitos->map(function (HitoAprendizaje $hito) use ($completitudHitos, &$actualEncontrado, &$completadas, &$requeridas): array {
            $desbloqueado = $hito->prerrequisitos->every(fn (HitoAprendizaje $prerrequisito): bool => (bool) ($completitudHitos[$prerrequisito->id] ?? false));
            $hitoCompletado = (bool) $completitudHitos[$hito->id];
            $anterioresObligatoriasCompletas = true;
            $experiencias = $hito->experiencias->map(function (ExperienciaAprendizaje $experiencia) use (
                $desbloqueado,
                &$actualEncontrado,
                &$anterioresObligatoriasCompletas,
                &$completadas,
                &$requeridas,
            ): array {
                $progreso = $experiencia->progresos->first();
                $intentos = $experiencia->intentos->sortBy('numero')->values();
                $completada = $progreso?->estado === 'completed';
                $accesible = $desbloqueado && $anterioresObligatoriasCompletas;
                $esActual = ! $actualEncontrado && $accesible && ! $completada && $experiencia->obligatoria;
                if ($esActual) {
                    $actualEncontrado = true;
                }
                if ($experiencia->obligatoria) {
                    $requeridas++;
                    $completadas += $completada ? 1 : 0;
                    $anterioresObligatoriasCompletas = $anterioresObligatoriasCompletas && $completada;
                }

                return [
                    'id' => $experiencia->id,
                    'type' => $experiencia->tipo->value,
                    'variant' => $experiencia->variante,
                    'title' => $experiencia->titulo,
                    'order' => $experiencia->orden,
                    'required' => $experiencia->obligatoria,
                    'attemptable' => $experiencia->permite_intentos,
                    'maxAttempts' => $experiencia->max_intentos,
                    'sourceType' => $experiencia->origen_tipo,
                    'sourceId' => $experiencia->origen_id,
                    'state' => $completada ? 'completed' : ($esActual ? 'current' : ($accesible ? 'unlocked' : 'locked')),
                    'progressPercent' => $progreso?->porcentaje ?? 0,
                    'summary' => $experiencia->descripcion,
                    'content' => $experiencia->contenido,
                    'instructions' => $experiencia->guia_entrega,
                    'latestFeedback' => $this->ultimoFeedbackResumen($intentos),
                    'attemptLifecycle' => $this->estadoIntentos($experiencia, $intentos),
                    'attempts' => $intentos->map(fn (IntentoAprendizaje $intento): array => $this->intentoResumen($intento))->values(),
                    'objectives' => $experiencia->objetivos->map(fn ($objetivo): array => [
                        'id' => $objetivo->id,
                        'code' => $objetivo->codigo,
                        'description' => $objetivo->descripcion,
                    ])->values(),
                ];
            })->values();

            return [
                'id' => $hito->id,
                'title' => $hito->titulo,
                'description' => $hito->descripcion,
                'order' => $hito->orden,
                'required' => $hito->obligatorio,
                'state' => $hitoCompletado ? 'completed' : ($desbloqueado ? 'unlocked' : 'locked'),
                'prerequisiteIds' => $hito->prerrequisitos->pluck('id')->values(),
                'experiences' => $experiencias,
            ];
        })->values();

        return [
            'enrollment' => $this->matriculaResumen($matricula),
            'courseVersion' => $this->versionResumen($contexto['version']),
            'path' => [
                'id' => $ruta->id,
                'title' => $ruta->titulo,
                'description' => $ruta->descripcion,
                'audience' => $ruta->audiencia->value,
                'difficulty' => $ruta->etapa->value,
                'state' => $requeridas > 0 && $completadas === $requeridas ? 'completed' : 'inProgress',
            ],
            'progress' => [
                'requiredExperienceCount' => $requeridas,
                'completedRequiredExperienceCount' => $completadas,
                'percent' => $requeridas > 0 ? (int) round($completadas * 100 / $requeridas) : 0,
            ],
            'milestones' => $hitos,
            'nextItem' => $hitos->flatMap(fn (array $hito) => $hito['experiences'])
                ->first(fn (array $experiencia): bool => $experiencia['state'] === 'current'),
            'legacyFallback' => false,
        ];
    }

    public function siguiente(Usuario $alumno): ?array
    {
        return $this->mapa($alumno)['nextItem'];
    }

    public function rutasDisponibles(Usuario $alumno): array
    {
        $versionIds = MatriculaAula::query()
            ->where('matriculas_aula.id_usuario', $alumno->id)
            ->where('matriculas_aula.rol', 'student')
            ->where('matriculas_aula.estado', 'active')
            ->leftJoin('aulas', 'aulas.id', '=', 'matriculas_aula.id_aula')
            ->selectRaw('COALESCE(matriculas_aula.id_version_curso, aulas.id_version_curso) as version_id')
            ->pluck('version_id')
            ->filter()
            ->unique();
        if ($versionIds->isEmpty()) {
            return [];
        }

        return RutaAprendizaje::query()
            ->whereIn('id_version_curso', $versionIds)
            ->where('estado', 'published')
            ->whereIn('audiencia', [$alumno->nivel, AudienciaAprendizaje::TODOS->value])
            ->withCount('hitos')
            ->orderBy('titulo')
            ->get()
            ->map(fn (RutaAprendizaje $ruta): array => [
                'id' => $ruta->id,
                'title' => $ruta->titulo,
                'description' => $ruta->descripcion,
                'audience' => $ruta->audiencia->value,
                'difficulty' => $ruta->etapa->value,
                'courseVersionId' => $ruta->id_version_curso,
                'milestoneCount' => $ruta->hitos_count,
            ])->all();
    }

    public function detalleRuta(Usuario $alumno, RutaAprendizaje $ruta): array
    {
        abort_unless(in_array($ruta->estado, ['published', 'archived'], true) && $ruta->audiencia->incluye((string) $alumno->nivel), 404);
        $autorizada = MatriculaAula::query()
            ->where('matriculas_aula.id_usuario', $alumno->id)
            ->where('matriculas_aula.rol', 'student')
            ->where('matriculas_aula.estado', 'active')
            ->leftJoin('aulas', 'aulas.id', '=', 'matriculas_aula.id_aula')
            ->where(fn (Builder $query) => $query
                ->where('matriculas_aula.id_version_curso', $ruta->id_version_curso)
                ->orWhere('aulas.id_version_curso', $ruta->id_version_curso))
            ->exists();
        abort_unless($autorizada, 404);
        $ruta->load(['versionCurso', 'hitos.prerrequisitos:id', 'hitos.experiencias.objetivos:id,codigo,descripcion']);

        return [
            'id' => $ruta->id,
            'title' => $ruta->titulo,
            'description' => $ruta->descripcion,
            'audience' => $ruta->audiencia->value,
            'difficulty' => $ruta->etapa->value,
            'courseVersion' => $this->versionResumen($ruta->versionCurso),
            'milestones' => $ruta->hitos->map(fn (HitoAprendizaje $hito): array => [
                'id' => $hito->id,
                'title' => $hito->titulo,
                'description' => $hito->descripcion,
                'order' => $hito->orden,
                'required' => $hito->obligatorio,
                'prerequisiteIds' => $hito->prerrequisitos->pluck('id')->values(),
                'experiences' => $hito->experiencias->map(fn (ExperienciaAprendizaje $experiencia): array => [
                    'id' => $experiencia->id,
                    'type' => $experiencia->tipo->value,
                    'variant' => $experiencia->variante,
                    'title' => $experiencia->titulo,
                    'order' => $experiencia->orden,
                    'required' => $experiencia->obligatoria,
                ])->values(),
            ])->values(),
        ];
    }

    public function iniciarIntento(Usuario $alumno, ExperienciaAprendizaje $experiencia, string $clave): IntentoAprendizaje
    {
        return DB::transaction(function () use ($alumno, $experiencia, $clave): IntentoAprendizaje {
            $existente = IntentoAprendizaje::where('clave_idempotencia', $clave)->lockForUpdate()->first();
            if ($existente) {
                abort_unless((int) $existente->id_alumno === (int) $alumno->id, 409, 'La clave de idempotencia ya está en uso.');
                abort_unless((int) $existente->id_experiencia === (int) $experiencia->id, 409, 'La clave de idempotencia pertenece a otra experiencia.');

                return $existente;
            }
            $matricula = $this->matriculaParaExperiencia($alumno, $experiencia);
            $matricula = MatriculaAula::whereKey($matricula->id)->lockForUpdate()->firstOrFail();
            abort_unless($experiencia->permite_intentos, 422, 'Esta experiencia no admite intentos.');
            abort_unless($this->experienciaAccesible($alumno, $experiencia), 403, 'La experiencia todavía está bloqueada.');
            $intentos = IntentoAprendizaje::where('id_matricula', $matricula->id)
                ->where('id_experiencia', $experiencia->id)
                ->lockForUpdate()
                ->with('feedback')
                ->orderBy('numero')
                ->get();
            /** @var IntentoAprendizaje|null $ultimoIntento */
            $ultimoIntento = $intentos->last();
            $ultimoNumero = (int) ($ultimoIntento?->numero ?? 0);
            abort_if($experiencia->max_intentos && $ultimoNumero >= $experiencia->max_intentos, 422, 'Se alcanzó el máximo de intentos.');
            if ($ultimoIntento) {
                abort_if($ultimoIntento->estado === 'started', 422, 'Ya existe un intento en progreso para esta experiencia.');
                abort_if($ultimoIntento->estado === 'submitted', 422, 'La entrega actual todavía está pendiente de revisión.');
                abort_unless(
                    $ultimoIntento->estado === 'evaluated'
                        && ($ultimoIntento->aprobado === false || $ultimoIntento->feedback->isNotEmpty()),
                    422,
                    'La evaluación actual no habilita una nueva revisión.',
                );
            }

            return IntentoAprendizaje::create([
                'uuid' => (string) Str::uuid(),
                'clave_idempotencia' => $clave,
                'id_matricula' => $matricula->id,
                'id_alumno' => $alumno->id,
                'id_experiencia' => $experiencia->id,
                'numero' => $ultimoNumero + 1,
                'estado' => 'started',
                'iniciado_at' => now(),
                'metadatos' => $ultimoIntento ? [
                    'revisionContext' => [
                        'previousAttemptId' => $ultimoIntento->id,
                        'previousAttemptNumber' => $ultimoIntento->numero,
                    ],
                ] : null,
            ]);
        });
    }

    public function entregarEvidencia(Usuario $alumno, IntentoAprendizaje $intento, array $datos): IntentoAprendizaje
    {
        abort_unless((int) $intento->id_alumno === (int) $alumno->id, 403, 'El intento no pertenece al estudiante autenticado.');
        $intento->loadMissing('experiencia');
        if ($intento->numero > 1 && in_array($intento->experiencia->tipo, [
            TipoExperienciaAprendizaje::MISION,
            TipoExperienciaAprendizaje::EVALUACION,
            TipoExperienciaAprendizaje::PROYECTO,
        ], true)) {
            Validator::make($datos, [
                'metadatos.revision.whatChanged' => ['required', 'string', 'max:1000'],
                'metadatos.revision.whyChanged' => ['required', 'string', 'max:1000'],
                'metadatos.revision.feedbackUsed' => ['required', 'string', 'max:1000'],
            ])->validate();
        }
        if (! empty($datos['id_objetivo'])) {
            abort_unless(
                $intento->experiencia()->whereHas('objetivos', fn (Builder $query) => $query->whereKey($datos['id_objetivo']))->exists(),
                422,
                'El objetivo no está vinculado a la experiencia.',
            );
        }

        return DB::transaction(function () use ($intento, $datos): IntentoAprendizaje {
            $intento = IntentoAprendizaje::whereKey($intento->id)->lockForUpdate()->firstOrFail();
            if ($intento->estado !== 'started') {
                return $intento->load(['evidencias', 'feedback']);
            }
            $metadatos = $datos['metadatos'] ?? [];
            if ($intento->numero > 1) {
                $intentoAnterior = IntentoAprendizaje::query()
                    ->where('id_matricula', $intento->id_matricula)
                    ->where('id_experiencia', $intento->id_experiencia)
                    ->where('numero', '<', $intento->numero)
                    ->orderByDesc('numero')
                    ->first();
                abort_unless($intentoAnterior, 409, 'No se encontró el intento anterior de esta revisión.');
                $metadatos['revisionContext'] = [
                    'previousAttemptId' => $intentoAnterior->id,
                    'previousAttemptNumber' => $intentoAnterior->numero,
                ];
            }
            $intento->evidencias()->create([
                'uuid' => (string) Str::uuid(),
                'id_objetivo' => $datos['id_objetivo'] ?? null,
                'tipo' => $datos['tipo'],
                'referencia' => $datos['referencia'] ?? null,
                'metadatos' => $metadatos ?: null,
                'registrado_at' => now(),
            ]);
            $intento->update(['estado' => 'submitted', 'enviado_at' => now()]);
            $intento->loadMissing(['experiencia.hito.ruta.versionCurso', 'matricula']);
            $this->emitirEvento($intento, $intento->experiencia->tipo === TipoExperienciaAprendizaje::PROYECTO
                ? 'learning.project.submitted'
                : 'learning.experience.submitted', 'submitted');

            if (($intento->experiencia->regla_completitud['modo'] ?? null) === 'submission'
                && ! $this->requiereEvaluacionDocente($intento->experiencia)) {
                $this->completarExperiencia($intento->matricula, $intento->experiencia, $intento);
            }

            return $intento->fresh(['evidencias', 'feedback']);
        });
    }

    public function evaluarIntento(Usuario $actor, IntentoAprendizaje $intento, array $datos): IntentoAprendizaje
    {
        $intento->loadMissing(['matricula.aula', 'experiencia.hito.ruta.versionCurso']);
        $this->autorizarEvaluacion($actor, $intento);

        return DB::transaction(function () use ($actor, $intento, $datos): IntentoAprendizaje {
            $intento = IntentoAprendizaje::whereKey($intento->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($intento->estado, ['submitted', 'evaluated'], true), 422, 'El intento todavía no fue enviado.');
            $ultimoFeedback = $intento->feedback()->latest('id')->first();
            $puntajeSolicitado = array_key_exists('puntaje', $datos) && $datos['puntaje'] !== null
                ? (float) $datos['puntaje']
                : null;
            $mismoResultado = $intento->estado === 'evaluated'
                && $intento->aprobado === (bool) $datos['aprobado']
                && $puntajeSolicitado === ($intento->puntaje !== null ? (float) $intento->puntaje : null);
            $mismoFeedback = (! array_key_exists('comentario', $datos) && ! array_key_exists('criterios', $datos))
                || ($ultimoFeedback
                    && $ultimoFeedback->comentario === ($datos['comentario'] ?? null)
                    && $ultimoFeedback->criterios === ($datos['criterios'] ?? null));
            if ($mismoResultado && $mismoFeedback) {
                return $intento->load(['evidencias', 'feedback']);
            }
            $intento->update([
                'estado' => 'evaluated',
                'puntaje' => $datos['puntaje'] ?? null,
                'aprobado' => $datos['aprobado'],
                'evaluado_at' => now(),
            ]);
            if (array_key_exists('comentario', $datos) || array_key_exists('criterios', $datos)) {
                FeedbackAprendizaje::create([
                    'uuid' => (string) Str::uuid(),
                    'id_intento' => $intento->id,
                    'id_autor' => $actor->id,
                    'comentario' => $datos['comentario'] ?? null,
                    'criterios' => $datos['criterios'] ?? null,
                    'registrado_at' => now(),
                ]);
            }
            if ($intento->aprobado) {
                $intento->loadMissing(['matricula', 'experiencia.hito.ruta.versionCurso']);
                if ($intento->experiencia->tipo === TipoExperienciaAprendizaje::EVALUACION) {
                    $this->emitirEvento($intento, 'learning.assessment.passed', 'passed');
                }
                $this->completarExperiencia($intento->matricula, $intento->experiencia, $intento);
            }

            return $intento->fresh(['evidencias', 'feedback']);
        });
    }

    public function listarRevisiones(Usuario $actor, array $filtros = []): array
    {
        abort_unless(in_array($actor->rol, ['docente', 'admin'], true), 403);

        $query = IntentoAprendizaje::query()
            ->with([
                'alumno:id,nombre_completo,usuario,email,nivel,avatar',
                'matricula.aula:id,nombre,codigo,id_institucion',
                'matricula.aula.curso:id,titulo',
                'experiencia.hito.ruta.versionCurso.curso:id,titulo',
                'experiencia.objetivos:id,codigo,descripcion',
                'evidencias',
                'feedback.autor:id,nombre_completo',
            ])
            ->whereIn('estado', ['submitted', 'evaluated']);

        if ($actor->rol !== 'admin') {
            $query->whereHas('matricula.aula', function (Builder $q) use ($actor) {
                if (filled($actor->id_institucion)) {
                    $q->where('id_institucion', $actor->id_institucion);
                }
                if (filled($actor->id_aula)) {
                    $q->where('id', $actor->id_aula);
                }
            });
        }

        if (! empty($filtros['estado'])) {
            $estado = match ($filtros['estado']) {
                'pending', 'submitted' => 'submitted',
                'reviewed', 'evaluated' => 'evaluated',
                default => null,
            };
            if ($estado) {
                $query->where('estado', $estado);
            }
        }

        if (! empty($filtros['id_curso'])) {
            $idCurso = (int) $filtros['id_curso'];
            $query->whereHas('experiencia.hito.ruta.versionCurso', fn (Builder $q) => $q->where('id_curso', $idCurso));
        }

        if (! empty($filtros['id_aula'])) {
            $query->whereHas('matricula', fn (Builder $q) => $q->where('id_aula', (int) $filtros['id_aula']));
        }

        $intentos = $query->orderByRaw("CASE WHEN estado = 'submitted' THEN 0 ELSE 1 END")
            ->orderBy('enviado_at', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return $intentos->map(fn (IntentoAprendizaje $intento): array => $this->serializarIntentoRevision($intento))->values()->all();
    }

    public function detalleRevision(Usuario $actor, IntentoAprendizaje $intento): array
    {
        $intento->loadMissing(['matricula.aula', 'experiencia.hito.ruta.versionCurso']);
        $this->autorizarEvaluacion($actor, $intento);

        return $this->serializarIntentoRevision($intento);
    }

    public function serializarIntentoRevision(IntentoAprendizaje $intento): array
    {
        $intento->loadMissing([
            'alumno:id,nombre_completo,usuario,email,nivel,avatar',
            'matricula.aula:id,nombre,codigo,id_institucion',
            'matricula.aula.curso:id,titulo',
            'experiencia.hito.ruta.versionCurso.curso:id,titulo',
            'experiencia.objetivos:id,codigo,descripcion',
            'evidencias',
            'feedback.autor:id,nombre_completo',
        ]);

        return [
            'id' => $intento->id,
            'uuid' => $intento->uuid,
            'attemptNumber' => $intento->numero,
            'status' => $intento->estado,
            'score' => $intento->puntaje !== null ? (float) $intento->puntaje : null,
            'approved' => $intento->aprobado,
            'submittedAt' => $intento->enviado_at?->toIso8601String(),
            'evaluatedAt' => $intento->evaluado_at?->toIso8601String(),
            'student' => [
                'id' => $intento->alumno?->id,
                'name' => $intento->alumno?->nombre_completo ?? $intento->alumno?->usuario ?? 'Estudiante',
                'username' => $intento->alumno?->usuario ?? '',
                'level' => $intento->alumno?->nivel ?? 'TEENS',
                'avatar' => $intento->alumno?->avatar,
            ],
            'cohort' => [
                'id' => $intento->matricula?->aula?->id,
                'name' => $intento->matricula?->aula?->nombre ?? 'Aula',
                'code' => $intento->matricula?->aula?->codigo,
            ],
            'course' => [
                'id' => $intento->experiencia?->hito?->ruta?->versionCurso?->curso?->id ?? $intento->matricula?->aula?->curso?->id,
                'title' => $intento->experiencia?->hito?->ruta?->versionCurso?->curso?->titulo ?? $intento->matricula?->aula?->curso?->titulo ?? 'Curso',
                'version' => $intento->experiencia?->hito?->ruta?->versionCurso?->version ?? null,
            ],
            'milestone' => [
                'id' => $intento->experiencia?->hito?->id,
                'title' => $intento->experiencia?->hito?->titulo,
                'order' => $intento->experiencia?->hito?->orden,
            ],
            'experience' => [
                'id' => $intento->experiencia?->id,
                'title' => $intento->experiencia?->titulo,
                'type' => $intento->experiencia?->tipo?->value ?? 'mission',
                'order' => $intento->experiencia?->orden,
                'summary' => $intento->experiencia?->descripcion,
                'content' => $intento->experiencia?->contenido,
                'instructions' => $intento->experiencia?->guia_entrega,
                'objectives' => $intento->experiencia?->objetivos->map(fn ($obj): array => [
                    'id' => $obj->id,
                    'code' => $obj->codigo,
                    'description' => $obj->descripcion,
                ])->values()->all() ?? [],
            ],
            'evidences' => $intento->evidencias->map(fn ($ev): array => [
                'id' => $ev->id,
                'type' => $ev->tipo,
                'reference' => $ev->referencia,
                'metadata' => $ev->metadatos,
                'registeredAt' => $ev->registrado_at?->toIso8601String(),
            ])->values()->all(),
            'feedback' => $intento->feedback->map(fn ($fb): array => [
                'id' => $fb->id,
                'comment' => $fb->comentario,
                'criteria' => $fb->criterios,
                'authorName' => $fb->autor?->nombre_completo ?? 'Docente',
                'registeredAt' => $fb->registrado_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    public function completarLeccion(Usuario $alumno, int $leccionId, MatriculaAula $matricula): void
    {
        $versionId = $this->versionIdMatricula($matricula);
        $experiencia = ExperienciaAprendizaje::query()
            ->where('tipo', TipoExperienciaAprendizaje::LECCION->value)
            ->where('origen_tipo', 'leccion')
            ->where('origen_id', $leccionId)
            ->whereHas('hito.ruta', fn (Builder $query) => $query
                ->where('estado', 'published')
                ->where(function (Builder $query) use ($matricula, $versionId): void {
                    if ($matricula->id_ruta_aprendizaje) {
                        $query->where('id', $matricula->id_ruta_aprendizaje);
                    } else {
                        $query->where('id_version_curso', $versionId);
                    }
                }))
            ->first();
        if ($experiencia && $this->experienciaAccesible($alumno, $experiencia)) {
            $this->completarExperiencia($matricula, $experiencia);
        }
    }

    public function experienciaAccesible(Usuario $alumno, ExperienciaAprendizaje $experiencia): bool
    {
        $mapa = $this->mapa($alumno);
        foreach ($mapa['milestones'] as $hito) {
            foreach ($hito['experiences'] as $item) {
                if ((int) $item['id'] === (int) $experiencia->id) {
                    return in_array($item['state'], ['current', 'unlocked', 'completed'], true);
                }
            }
        }

        return false;
    }

    public function registrarEvaluacionExistente(Usuario $alumno, int $evaluacionId, int $resultadoId, float $puntaje): void
    {
        $experiencia = $this->experienciaPorFuente($alumno, 'evaluacion', $evaluacionId);
        if (! $experiencia || ! $this->experienciaAccesible($alumno, $experiencia)) {
            return;
        }
        DB::transaction(function () use ($alumno, $experiencia, $resultadoId, $puntaje): void {
            $matricula = $this->matriculaParaExperiencia($alumno, $experiencia);
            $matricula = MatriculaAula::whereKey($matricula->id)->lockForUpdate()->firstOrFail();
            $clave = "legacy-evaluation-result:{$resultadoId}";
            $intento = IntentoAprendizaje::where('clave_idempotencia', $clave)->lockForUpdate()->first();
            if (! $intento) {
                $numero = (int) IntentoAprendizaje::where('id_matricula', $matricula->id)
                    ->where('id_experiencia', $experiencia->id)->max('numero') + 1;
                $intento = IntentoAprendizaje::create([
                    'uuid' => (string) Str::uuid(),
                    'clave_idempotencia' => $clave,
                    'id_matricula' => $matricula->id,
                    'id_alumno' => $alumno->id,
                    'id_experiencia' => $experiencia->id,
                    'numero' => $numero,
                    'estado' => 'evaluated',
                    'puntaje' => $puntaje,
                    'aprobado' => false,
                    'iniciado_at' => now(),
                    'enviado_at' => now(),
                    'evaluado_at' => now(),
                    'metadatos' => ['legacyEvaluationResultId' => $resultadoId],
                ]);
                $intento->evidencias()->create([
                    'uuid' => (string) Str::uuid(),
                    'tipo' => 'assessment_result',
                    'metadatos' => ['resultId' => $resultadoId, 'score' => $puntaje],
                    'registrado_at' => now(),
                ]);
            }
            $minimo = (float) ($experiencia->regla_completitud['puntaje_minimo'] ?? 70);
            $aprobado = $puntaje >= $minimo;
            $intento->update(['estado' => 'evaluated', 'puntaje' => $puntaje, 'aprobado' => $aprobado, 'evaluado_at' => now()]);
            if ($aprobado) {
                $intento->loadMissing(['matricula', 'experiencia.hito.ruta.versionCurso']);
                $this->emitirEvento($intento, 'learning.assessment.passed', 'passed');
                $this->completarExperiencia($matricula, $experiencia, $intento);
            }
        });
    }

    public function registrarEntregaMision(Usuario $alumno, int $misionId, int $entregaId, string $referencia): void
    {
        $experiencia = $this->experienciaPorFuente($alumno, 'mision', $misionId);
        if (! $experiencia || ! $this->experienciaAccesible($alumno, $experiencia)) {
            return;
        }
        DB::transaction(function () use ($alumno, $experiencia, $entregaId, $referencia): void {
            $matricula = $this->matriculaParaExperiencia($alumno, $experiencia);
            $matricula = MatriculaAula::whereKey($matricula->id)->lockForUpdate()->firstOrFail();
            $clave = "legacy-mission-delivery:{$entregaId}";
            $intento = IntentoAprendizaje::firstOrCreate(
                ['clave_idempotencia' => $clave],
                [
                    'uuid' => (string) Str::uuid(),
                    'id_matricula' => $matricula->id,
                    'id_alumno' => $alumno->id,
                    'id_experiencia' => $experiencia->id,
                    'numero' => (int) IntentoAprendizaje::where('id_matricula', $matricula->id)->where('id_experiencia', $experiencia->id)->max('numero') + 1,
                    'estado' => 'submitted',
                    'iniciado_at' => now(),
                    'enviado_at' => now(),
                    'metadatos' => ['legacyMissionDeliveryId' => $entregaId],
                ],
            );
            if ($intento->wasRecentlyCreated) {
                $intento->evidencias()->create([
                    'uuid' => (string) Str::uuid(),
                    'tipo' => 'mission_delivery',
                    'referencia' => $referencia,
                    'metadatos' => ['deliveryId' => $entregaId],
                    'registrado_at' => now(),
                ]);
                $intento->loadMissing(['matricula', 'experiencia.hito.ruta.versionCurso']);
                $this->emitirEvento($intento, 'learning.experience.submitted', 'submitted');
            }
        });
    }

    public function revisarEntregaMision(Usuario $actor, int $entregaId, bool $aprobada, ?float $puntaje, ?string $comentario): void
    {
        $intento = IntentoAprendizaje::where('clave_idempotencia', "legacy-mission-delivery:{$entregaId}")->first();
        if (! $intento) {
            return;
        }
        $this->evaluarIntento($actor, $intento, [
            'aprobado' => $aprobada,
            'puntaje' => $puntaje,
            'comentario' => $comentario,
        ]);
    }

    private function completarExperiencia(
        MatriculaAula $matricula,
        ExperienciaAprendizaje $experiencia,
        ?IntentoAprendizaje $intento = null,
    ): ProgresoExperiencia {
        $progreso = ProgresoExperiencia::firstOrCreate(
            ['id_matricula' => $matricula->id, 'id_experiencia' => $experiencia->id],
            ['id_alumno' => $matricula->id_usuario, 'estado' => 'notStarted', 'porcentaje' => 0],
        );
        if ($progreso->estado !== 'completed') {
            $progreso->forceFill([
                'id_intento_completado' => $intento?->id,
                'estado' => 'completed',
                'porcentaje' => 100,
                'iniciado_at' => $progreso->iniciado_at ?? now(),
                'completado_at' => now(),
            ])->save();
        }
        $experiencia->loadMissing('hito.ruta.versionCurso');
        $this->emitirEventoExperiencia($matricula, $experiencia, 'learning.experience.completed', 'completed');
        $this->evaluarTransicionesSuperiores($matricula, $experiencia->hito->ruta);

        return $progreso;
    }

    /** @param Collection<int, IntentoAprendizaje> $intentos */
    private function ultimoFeedbackResumen(Collection $intentos): ?array
    {
        foreach ($intentos->reverse() as $intento) {
            $feedback = $intento->feedback->sortBy('registrado_at')->last();
            if ($feedback) {
                return [
                    'comment' => $feedback->comentario,
                    'criteria' => $feedback->criterios,
                    'registeredAt' => $feedback->registrado_at?->toIso8601String(),
                    'attemptId' => $intento->id,
                    'attemptNumber' => $intento->numero,
                ];
            }
        }

        return null;
    }

    private function intentoResumen(IntentoAprendizaje $intento): array
    {
        return [
            'id' => $intento->id,
            'number' => $intento->numero,
            'state' => $intento->estado,
            'score' => $intento->puntaje !== null ? (float) $intento->puntaje : null,
            'approved' => $intento->aprobado,
            'startedAt' => $intento->iniciado_at?->toIso8601String(),
            'submittedAt' => $intento->enviado_at?->toIso8601String(),
            'evaluatedAt' => $intento->evaluado_at?->toIso8601String(),
            'metadata' => $intento->metadatos,
            'evidence' => $intento->evidencias->sortBy('registrado_at')->map(fn ($evidencia): array => [
                'id' => $evidencia->id,
                'type' => $evidencia->tipo,
                'reference' => $evidencia->referencia,
                'metadata' => $evidencia->metadatos,
                'registeredAt' => $evidencia->registrado_at?->toIso8601String(),
            ])->values(),
            'feedback' => $intento->feedback->sortBy('registrado_at')->map(fn ($feedback): array => [
                'comment' => $feedback->comentario,
                'criteria' => $feedback->criterios,
                'registeredAt' => $feedback->registrado_at?->toIso8601String(),
            ])->values(),
        ];
    }

    /** @param Collection<int, IntentoAprendizaje> $intentos */
    private function estadoIntentos(ExperienciaAprendizaje $experiencia, Collection $intentos): array
    {
        /** @var IntentoAprendizaje|null $ultimo */
        $ultimo = $intentos->last();
        $dentroDelLimite = ! $experiencia->max_intentos || $intentos->count() < $experiencia->max_intentos;
        $puedeRevisar = (bool) ($ultimo
            && $experiencia->permite_intentos
            && $dentroDelLimite
            && $ultimo->estado === 'evaluated'
            && $ultimo->aprobado === false);

        $estado = match (true) {
            ! $ultimo => 'notStarted',
            $ultimo->estado === 'started' && $ultimo->numero > 1 => 'revisionInProgress',
            $ultimo->estado === 'started' => 'inProgress',
            $ultimo->estado === 'submitted' && $ultimo->numero > 1 => 'resubmitted',
            $ultimo->estado === 'submitted' => 'awaitingFeedback',
            $ultimo->estado === 'evaluated' && $ultimo->numero > 1 => 'reviewedAgain',
            $ultimo->estado === 'evaluated' && $ultimo->aprobado === true => 'completed',
            default => 'feedbackReceived',
        };
        $accion = match (true) {
            ! $ultimo && $experiencia->permite_intentos => 'start',
            $ultimo?->estado === 'started' => 'resume',
            $ultimo?->estado === 'submitted' => 'wait',
            $puedeRevisar => 'improve',
            $ultimo?->aprobado === true => 'continue',
            default => 'none',
        };

        return [
            'state' => $estado,
            'action' => $accion,
            'canStartAttempt' => ! $ultimo && $experiencia->permite_intentos,
            'canRevise' => $puedeRevisar,
            'revisionAvailable' => $puedeRevisar,
            'revisionExplanationRequired' => $puedeRevisar && in_array($experiencia->tipo, [
                TipoExperienciaAprendizaje::MISION,
                TipoExperienciaAprendizaje::EVALUACION,
                TipoExperienciaAprendizaje::PROYECTO,
            ], true),
            'activeAttemptId' => $ultimo?->estado === 'started' ? $ultimo->id : null,
            'activeAttemptNumber' => $ultimo?->estado === 'started' ? $ultimo->numero : null,
        ];
    }

    private function requiereEvaluacionDocente(ExperienciaAprendizaje $experiencia): bool
    {
        return in_array($experiencia->tipo, [
            TipoExperienciaAprendizaje::MISION,
            TipoExperienciaAprendizaje::LABORATORIO,
            TipoExperienciaAprendizaje::EVALUACION,
            TipoExperienciaAprendizaje::PROYECTO,
            TipoExperienciaAprendizaje::DESAFIO,
        ], true);
    }

    private function evaluarTransicionesSuperiores(MatriculaAula $matricula, RutaAprendizaje $ruta): void
    {
        $versionId = $this->versionIdMatricula($matricula);
        $ruta->load(['hitos.experiencias.progresos' => fn ($query) => $query->where('id_matricula', $matricula->id)]);
        foreach ($ruta->hitos as $hito) {
            if (! $hito->obligatorio || ! $this->hitoCompletado($hito)) {
                continue;
            }
            $this->outbox->registrarIdempotente(
                "learning:milestone:{$hito->id}:enrollment:{$matricula->id}:completed",
                'learning.milestone.completed',
                'hito_aprendizaje',
                $hito->id,
                ['studentId' => $matricula->id_usuario, 'enrollmentId' => $matricula->id, 'pathId' => $ruta->id, 'milestoneId' => $hito->id],
                $matricula->id_usuario,
                $matricula->id,
                $versionId,
            );
            $this->outbox->registrarIdempotente(
                "learning:path:{$ruta->id}:enrollment:{$matricula->id}:milestone:{$hito->id}",
                'learning.path.progressed',
                'ruta_aprendizaje',
                $ruta->id,
                ['studentId' => $matricula->id_usuario, 'enrollmentId' => $matricula->id, 'pathId' => $ruta->id, 'milestoneId' => $hito->id],
                $matricula->id_usuario,
                $matricula->id,
                $versionId,
            );
        }
        $requeridos = $ruta->hitos->where('obligatorio', true);
        if ($requeridos->isEmpty() || ! $requeridos->every(fn (HitoAprendizaje $hito): bool => $this->hitoCompletado($hito))) {
            return;
        }
        $contexto = ['studentId' => $matricula->id_usuario, 'enrollmentId' => $matricula->id, 'pathId' => $ruta->id, 'courseVersionId' => $versionId];
        $this->outbox->registrarIdempotente(
            "learning:course-version:{$versionId}:enrollment:{$matricula->id}:completed",
            'learning.course.completed',
            'version_curso',
            $versionId ?? 'legacy',
            $contexto,
            $matricula->id_usuario,
            $matricula->id,
            $versionId,
        );
        $this->outbox->registrarIdempotente(
            "learning:path:{$ruta->id}:enrollment:{$matricula->id}:completed",
            'learning.path.completed',
            'ruta_aprendizaje',
            $ruta->id,
            $contexto,
            $matricula->id_usuario,
            $matricula->id,
            $versionId,
        );
    }

    private function emitirEvento(IntentoAprendizaje $intento, string $tipo, string $transicion): void
    {
        $this->emitirEventoExperiencia($intento->matricula, $intento->experiencia, $tipo, "attempt:{$intento->id}:{$transicion}", $intento->id);
    }

    private function emitirEventoExperiencia(
        MatriculaAula $matricula,
        ExperienciaAprendizaje $experiencia,
        string $tipo,
        string $transicion,
        ?int $intentoId = null,
    ): void {
        $ruta = $experiencia->hito->ruta;
        $versionId = $this->versionIdMatricula($matricula);
        $this->outbox->registrarIdempotente(
            "learning:experience:{$experiencia->id}:enrollment:{$matricula->id}:{$transicion}",
            $tipo,
            'experiencia_aprendizaje',
            $experiencia->id,
            [
                'studentId' => $matricula->id_usuario,
                'enrollmentId' => $matricula->id,
                'courseVersionId' => $versionId,
                'pathId' => $ruta->id,
                'milestoneId' => $experiencia->id_hito,
                'experienceId' => $experiencia->id,
                'experienceType' => $experiencia->tipo->value,
                'attemptId' => $intentoId,
            ],
            $matricula->id_usuario,
            $matricula->id,
            $versionId,
        );
    }

    private function hitoCompletado(HitoAprendizaje $hito): bool
    {
        $obligatorias = $hito->experiencias->where('obligatoria', true);

        return $obligatorias->isNotEmpty()
            && $obligatorias->every(fn (ExperienciaAprendizaje $experiencia): bool => $experiencia->progresos->first()?->estado === 'completed');
    }

    private function matriculaParaExperiencia(Usuario $alumno, ExperienciaAprendizaje $experiencia): MatriculaAula
    {
        $experiencia->loadMissing('hito.ruta');
        $matricula = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', today()))
            ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', today()))
            ->where(function (Builder $query) use ($experiencia): void {
                $query->where('id_ruta_aprendizaje', $experiencia->hito->id_ruta)
                    ->orWhere(function (Builder $query) use ($experiencia): void {
                        $query->whereNull('id_ruta_aprendizaje')
                            ->where(function (Builder $query) use ($experiencia): void {
                                $query->where('id_version_curso', $experiencia->hito->ruta->id_version_curso)
                                    ->orWhere(function (Builder $query) use ($experiencia): void {
                                        $query->whereNull('id_version_curso')
                                            ->whereHas('aula', fn (Builder $query) => $query->where('id_version_curso', $experiencia->hito->ruta->id_version_curso));
                                    });
                            });
                    });
            })
            ->orderByDesc('es_principal')
            ->first();
        abort_unless($matricula, 403, 'La experiencia no pertenece a una matrícula activa.');

        return $matricula;
    }

    private function resolverContexto(Usuario $alumno): ?array
    {
        $matricula = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', today()))
            ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', today()))
            ->with(['aula.curso', 'aula.versionCurso', 'versionCurso', 'rutaAprendizaje'])
            ->orderByDesc('es_principal')
            ->orderByDesc('id')
            ->first();
        if (! $matricula) {
            return null;
        }
        $version = $matricula->versionCurso ?? $matricula->aula?->versionCurso;
        $ruta = $matricula->rutaAprendizaje;
        if ($ruta && (! in_array($ruta->estado, ['published', 'archived'], true) || ! $ruta->audiencia->incluye((string) $alumno->nivel))) {
            $ruta = null;
        }
        if (! $ruta && $version) {
            $ruta = RutaAprendizaje::query()
                ->where('id_version_curso', $version->id)
                ->where('estado', 'published')
                ->whereIn('audiencia', [$alumno->nivel, AudienciaAprendizaje::TODOS->value])
                ->orderByRaw('CASE WHEN audiencia = ? THEN 0 ELSE 1 END', [$alumno->nivel])
                ->orderBy('id')
                ->first();
        }

        return ['matricula' => $matricula, 'version' => $version, 'ruta' => $ruta];
    }

    private function experienciaPorFuente(Usuario $alumno, string $tipo, int $id): ?ExperienciaAprendizaje
    {
        $matriculas = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->with('aula:id,id_version_curso')
            ->get();
        $rutaIds = $matriculas->pluck('id_ruta_aprendizaje')->filter()->unique();
        $versionIds = $matriculas->whereNull('id_ruta_aprendizaje')
            ->map(fn (MatriculaAula $matricula) => $matricula->id_version_curso ?? $matricula->aula?->id_version_curso)
            ->filter()->unique();

        return ExperienciaAprendizaje::query()
            ->where('origen_tipo', $tipo)
            ->where('origen_id', $id)
            ->where('estado', 'published')
            ->whereHas('hito.ruta', fn (Builder $query) => $query
                ->where('estado', 'published')
                ->whereIn('audiencia', [$alumno->nivel, AudienciaAprendizaje::TODOS->value])
                ->where(fn (Builder $query) => $query->whereIn('id', $rutaIds)->orWhereIn('id_version_curso', $versionIds)))
            ->with('hito.ruta')
            ->first();
    }

    private function autorizarEvaluacion(Usuario $actor, IntentoAprendizaje $intento): void
    {
        abort_unless(in_array($actor->rol, ['docente', 'admin'], true), 403);
        if ($actor->rol !== 'admin') {
            if (filled($actor->id_institucion) && filled($intento->matricula?->aula?->id_institucion)) {
                abort_unless((int) $actor->id_institucion === (int) $intento->matricula->aula->id_institucion, 403, 'No puedes evaluar otra institución.');
            }
            if (filled($actor->id_aula) && filled($intento->matricula?->id_aula)) {
                abort_unless((int) $actor->id_aula === (int) $intento->matricula->id_aula, 403, 'No puedes evaluar otra aula.');
            }
        }
    }

    private function matriculaResumen(MatriculaAula $matricula): array
    {
        return ['id' => $matricula->id, 'cohortId' => $matricula->id_aula, 'status' => $matricula->estado];
    }

    private function versionResumen($version): ?array
    {
        return $version ? [
            'id' => $version->id,
            'courseId' => $version->id_curso,
            'number' => $version->numero,
            'audience' => $version->audiencia->value,
            'difficulty' => $version->etapa->value,
            'status' => $version->estado,
        ] : null;
    }

    private function versionIdMatricula(MatriculaAula $matricula): ?int
    {
        return $matricula->id_version_curso
            ? (int) $matricula->id_version_curso
            : ($matricula->aula?->id_version_curso
                ?? $matricula->aula()->value('id_version_curso'));
    }

    private function mapaVacio(): array
    {
        return [
            'enrollment' => null,
            'courseVersion' => null,
            'path' => null,
            'progress' => ['requiredExperienceCount' => 0, 'completedRequiredExperienceCount' => 0, 'percent' => 0],
            'milestones' => [],
            'nextItem' => null,
            'legacyFallback' => false,
        ];
    }
}
