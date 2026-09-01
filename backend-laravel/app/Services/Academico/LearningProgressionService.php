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
use Illuminate\Support\Facades\DB;
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
            'hitos.experiencias.progresos' => fn ($query) => $query->where('id_matricula', $matricula->id),
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

                return $existente;
            }
            $matricula = $this->matriculaParaExperiencia($alumno, $experiencia);
            $matricula = MatriculaAula::whereKey($matricula->id)->lockForUpdate()->firstOrFail();
            abort_unless($experiencia->permite_intentos, 422, 'Esta experiencia no admite intentos.');
            abort_unless($this->experienciaAccesible($alumno, $experiencia), 403, 'La experiencia todavía está bloqueada.');
            $ultimoNumero = (int) IntentoAprendizaje::where('id_matricula', $matricula->id)
                ->where('id_experiencia', $experiencia->id)
                ->lockForUpdate()
                ->max('numero');
            abort_if($experiencia->max_intentos && $ultimoNumero >= $experiencia->max_intentos, 422, 'Se alcanzó el máximo de intentos.');

            return IntentoAprendizaje::create([
                'uuid' => (string) Str::uuid(),
                'clave_idempotencia' => $clave,
                'id_matricula' => $matricula->id,
                'id_alumno' => $alumno->id,
                'id_experiencia' => $experiencia->id,
                'numero' => $ultimoNumero + 1,
                'estado' => 'started',
                'iniciado_at' => now(),
            ]);
        });
    }

    public function entregarEvidencia(Usuario $alumno, IntentoAprendizaje $intento, array $datos): IntentoAprendizaje
    {
        abort_unless((int) $intento->id_alumno === (int) $alumno->id, 403, 'El intento no pertenece al estudiante autenticado.');
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
            $intento->evidencias()->create([
                'uuid' => (string) Str::uuid(),
                'id_objetivo' => $datos['id_objetivo'] ?? null,
                'tipo' => $datos['tipo'],
                'referencia' => $datos['referencia'] ?? null,
                'metadatos' => $datos['metadatos'] ?? null,
                'registrado_at' => now(),
            ]);
            $intento->update(['estado' => 'submitted', 'enviado_at' => now()]);
            $intento->loadMissing(['experiencia.hito.ruta.versionCurso', 'matricula']);
            $this->emitirEvento($intento, $intento->experiencia->tipo === TipoExperienciaAprendizaje::PROYECTO
                ? 'learning.project.submitted'
                : 'learning.experience.submitted', 'submitted');

            if (($intento->experiencia->regla_completitud['modo'] ?? null) === 'submission') {
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
            abort_unless((int) $actor->id_institucion === (int) $intento->matricula->aula->id_institucion, 403, 'No puedes evaluar otra institución.');
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
