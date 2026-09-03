<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\MatriculaAula;
use App\Models\PeriodoAcademico;
use App\Models\SesionAprendizaje;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Operación docente de sesiones en vivo sobre cohortes reales.
 *
 * Solo lectura: la autoría (crear / editar / cancelar) sigue viviendo en
 * AprendizajeService a través de los contratos canónicos
 * POST /academico/aulas/{aula}/sesiones y PUT /academico/sesiones/{sesion}.
 * Este servicio no mantiene ningún calendario paralelo.
 */
class ArcCohortSessionOpsService
{
    public function __construct(private readonly AprendizajeService $aprendizaje) {}

    /**
     * Cohortes que el actor puede operar realmente.
     */
    public function cohortes(Usuario $actor): array
    {
        $ahora = CarbonImmutable::now('UTC');
        $aulas = $this->aulasOperables($actor);

        return [
            'cohorts' => $aulas
                ->map(fn (Aula $aula): array => $this->cohorteResumen($aula, $ahora))
                ->values()
                ->all(),
            'generatedAt' => $ahora->toIso8601ZuluString(),
        ];
    }

    /**
     * Sesiones reales de una cohorte, priorizadas y agrupadas por semana de entrega.
     */
    public function sesiones(
        Usuario $actor,
        Aula $aula,
        ?CarbonImmutable $inicio = null,
        ?CarbonImmutable $fin = null,
    ): array {
        $this->aprendizaje->autorizarAula($actor, $aula);

        $ahora = CarbonImmutable::now('UTC');
        $aula->loadMissing(['curso', 'periodoAcademico']);

        $sesiones = SesionAprendizaje::query()
            ->where('id_aula', $aula->id)
            ->when($inicio, fn (Builder $query) => $query->where('inicio_at', '>=', $inicio->utc()))
            ->when($fin, fn (Builder $query) => $query->where('inicio_at', '<', $fin->utc()))
            ->orderBy('inicio_at')
            ->orderBy('id')
            ->get();

        $ancla = $this->anclaSemanal($aula);
        $items = $sesiones
            ->map(fn (SesionAprendizaje $sesion): array => $this->sesionRespuesta($sesion, $ahora, $ancla))
            ->values();

        $proximas = $items
            ->filter(fn (array $sesion): bool => $sesion['timing'] === 'upcoming' && $sesion['status'] === 'scheduled')
            ->values();

        return [
            'cohort' => $this->cohorteResumen($aula, $ahora),
            'range' => [
                'start' => $inicio?->utc()->toIso8601ZuluString(),
                'end' => $fin?->utc()->toIso8601ZuluString(),
            ],
            'nextSession' => $proximas->first(),
            'upcoming' => $proximas->all(),
            'past' => $items
                ->filter(fn (array $sesion): bool => $sesion['timing'] === 'past')
                ->sortByDesc('startsAt')
                ->values()
                ->all(),
            'cancelled' => $items
                ->filter(fn (array $sesion): bool => $sesion['status'] === 'cancelled' && $sesion['timing'] !== 'past')
                ->values()
                ->all(),
            'delivery' => $this->entregaSemanal($items, $ancla),
            'generatedAt' => $ahora->toIso8601ZuluString(),
        ];
    }

    /**
     * @return Collection<int, Aula>
     */
    private function aulasOperables(Usuario $actor): Collection
    {
        $relaciones = ['curso', 'periodoAcademico'];

        if ($actor->rol === 'admin') {
            return Aula::query()
                ->where('id_institucion', $actor->id_institucion)
                ->with($relaciones)
                ->orderBy('nombre')
                ->get();
        }

        $hoy = CarbonImmutable::now('UTC')->toDateString();
        $porMatricula = MatriculaAula::query()
            ->where('id_usuario', $actor->id)
            ->whereIn('rol', ['teacher', 'administrator'])
            ->where('estado', 'active')
            ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', $hoy))
            ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', $hoy))
            ->pluck('id_aula');

        if ($actor->id_aula) {
            $porMatricula->push($actor->id_aula);
        }

        $ids = $porMatricula->unique()->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return Aula::query()
            ->whereIn('id', $ids)
            ->where('id_institucion', $actor->id_institucion)
            ->with($relaciones)
            ->orderBy('nombre')
            ->get();
    }

    private function cohorteResumen(Aula $aula, CarbonImmutable $ahora): array
    {
        $hoy = $ahora->toDateString();
        $alumnos = MatriculaAula::query()
            ->where('id_aula', $aula->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', $hoy))
            ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', $hoy))
            ->count();

        $siguiente = SesionAprendizaje::query()
            ->where('id_aula', $aula->id)
            ->where('estado', 'scheduled')
            ->where('inicio_at', '>=', $ahora)
            ->orderBy('inicio_at')
            ->orderBy('id')
            ->first();

        return [
            'id' => $aula->id,
            'name' => $aula->nombre,
            'code' => $aula->codigo,
            'level' => $aula->nivel,
            'course' => $this->cursoResumen($aula->curso),
            'period' => $this->periodoResumen($aula->periodoAcademico),
            'activeStudentCount' => $alumnos,
            'scheduledSessionCount' => SesionAprendizaje::query()
                ->where('id_aula', $aula->id)
                ->where('estado', 'scheduled')
                ->count(),
            'nextSessionAt' => $siguiente?->inicio_at->utc()->toIso8601ZuluString(),
        ];
    }

    private function cursoResumen(?Curso $curso): ?array
    {
        return $curso ? [
            'id' => $curso->id,
            'title' => $curso->titulo,
            'code' => $curso->codigo,
            'level' => $curso->nivel,
            'status' => $curso->estado,
        ] : null;
    }

    private function periodoResumen(?PeriodoAcademico $periodo): ?array
    {
        return $periodo ? [
            'id' => $periodo->id,
            'title' => $periodo->titulo,
            'startsOn' => $periodo->fecha_inicio?->toDateString(),
            'endsOn' => $periodo->fecha_fin?->toDateString(),
        ] : null;
    }

    /**
     * Ancla de la semana 1: el inicio de la semana de la primera sesión real de
     * la cohorte. Se deriva de datos reales, nunca de un calendario inventado
     * ni de un acoplamiento hito/sesión que el dominio no tiene.
     */
    private function anclaSemanal(Aula $aula): ?CarbonImmutable
    {
        $primera = SesionAprendizaje::query()
            ->where('id_aula', $aula->id)
            ->orderBy('inicio_at')
            ->orderBy('id')
            ->value('inicio_at');

        return $primera ? CarbonImmutable::parse($primera)->utc()->startOfWeek() : null;
    }

    private function sesionRespuesta(
        SesionAprendizaje $sesion,
        CarbonImmutable $ahora,
        ?CarbonImmutable $ancla,
    ): array {
        $inicio = $sesion->inicio_at->utc();
        $fin = $sesion->fin_at?->utc();
        $referencia = $fin ?? $inicio;

        return [
            'id' => $sesion->id,
            'uuid' => $sesion->uuid,
            'type' => $sesion->tipo,
            'title' => $sesion->titulo,
            'description' => $sesion->descripcion,
            'startsAt' => $inicio->toIso8601ZuluString(),
            'endsAt' => $fin?->toIso8601ZuluString(),
            'durationMinutes' => $fin ? (int) $inicio->diffInMinutes($fin) : null,
            'status' => $sesion->estado,
            'accessUrl' => $sesion->acceso_url,
            'timing' => $referencia->lessThan($ahora) ? 'past' : 'upcoming',
            'deliveryWeek' => $ancla ? (int) floor($ancla->diffInDays($inicio->startOfWeek()) / 7) + 1 : null,
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     */
    private function entregaSemanal(Collection $items, ?CarbonImmutable $ancla): array
    {
        if ($ancla === null || $items->isEmpty()) {
            return ['anchorWeekStart' => null, 'weeks' => []];
        }

        $semanas = $items
            ->filter(fn (array $sesion): bool => $sesion['deliveryWeek'] !== null)
            ->groupBy('deliveryWeek')
            ->sortKeys()
            ->map(fn (Collection $sesiones, int|string $semana): array => [
                'week' => (int) $semana,
                'startsOn' => $ancla->addWeeks((int) $semana - 1)->toDateString(),
                'sessions' => $sesiones->values()->all(),
            ])
            ->values()
            ->all();

        return [
            'anchorWeekStart' => $ancla->toDateString(),
            'weeks' => $semanas,
        ];
    }
}
