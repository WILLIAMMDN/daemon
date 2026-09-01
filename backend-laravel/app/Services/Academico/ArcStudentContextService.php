<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\ProgresoLeccion;
use App\Models\SesionAprendizaje;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ArcStudentContextService
{
    public function home(Usuario $alumno): array
    {
        $ahora = CarbonImmutable::now('UTC');
        $contextos = $this->matriculasActivas($alumno, $ahora);
        $actual = $contextos->first();
        $sesiones = $this->sesionesEnRango($contextos, $ahora, $ahora->addDays(30), true);
        $siguienteLive = $sesiones->first();

        return [
            'student' => $this->alumnoResumen($alumno),
            'currentEnrollment' => $actual ? $this->matriculaRespuesta($actual) : null,
            'currentCourse' => $actual ? $this->cursoResumen($this->cursoPublicado($actual)) : null,
            'cohort' => $actual ? $this->aulaResumen($actual['aula']) : null,
            'nextLiveSession' => $siguienteLive ? $this->sesionRespuesta($siguienteLive) : null,
            'nextAction' => $this->siguienteAccion($alumno, $contextos, $siguienteLive),
            'upcomingAgendaSummary' => [
                'total' => $sesiones->count(),
                'items' => $sesiones->take(3)->map(fn (SesionAprendizaje $sesion): array => $this->sesionRespuesta($sesion))->values(),
            ],
            'generatedAt' => $ahora->toIso8601ZuluString(),
        ];
    }

    public function learning(Usuario $alumno): array
    {
        $ahora = CarbonImmutable::now('UTC');
        $contextos = $this->matriculasActivas($alumno, $ahora);
        $progreso = $this->progresoPorCurso($alumno, $contextos);
        $matriculas = $contextos->map(function (array $contexto) use ($progreso): array {
            $respuesta = $this->matriculaRespuesta($contexto);
            $curso = $this->cursoPublicado($contexto);
            $respuesta['progress'] = $curso ? ($progreso[$curso->id] ?? $this->progresoVacio()) : null;

            return $respuesta;
        })->values();

        return [
            'student' => $this->alumnoResumen($alumno),
            'currentEnrollment' => $matriculas->first(),
            'activeEnrollments' => $matriculas,
            'generatedAt' => $ahora->toIso8601ZuluString(),
        ];
    }

    public function agenda(Usuario $alumno, CarbonImmutable $inicio, CarbonImmutable $fin): array
    {
        $inicio = $inicio->utc();
        $fin = $fin->utc();
        $contextos = $this->matriculasActivas($alumno, CarbonImmutable::now('UTC'));
        $sesiones = $this->sesionesEnRango($contextos, $inicio, $fin);

        return [
            'range' => [
                'start' => $inicio->toIso8601ZuluString(),
                'end' => $fin->toIso8601ZuluString(),
            ],
            'events' => $sesiones->map(fn (SesionAprendizaje $sesion): array => $this->sesionRespuesta($sesion))->values(),
        ];
    }

    /**
     * @return Collection<int, array{enrollment: MatriculaAula|null, aula: Aula}>
     */
    private function matriculasActivas(Usuario $alumno, CarbonImmutable $ahora): Collection
    {
        $hoy = $ahora->toDateString();
        $matriculas = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', $hoy))
            ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', $hoy))
            ->with($this->relacionesAula($hoy))
            ->orderByDesc('es_principal')
            ->orderByRaw('CASE WHEN fecha_inicio IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (MatriculaAula $matricula): bool => $matricula->aula !== null)
            ->map(fn (MatriculaAula $matricula): array => [
                'enrollment' => $matricula,
                'aula' => $matricula->aula,
            ]);

        if ($matriculas->isNotEmpty() || ! $alumno->id_aula) {
            return $matriculas->values();
        }

        $tieneHistorial = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->exists();

        if ($tieneHistorial) {
            return collect();
        }

        $aula = Aula::query()->with($this->relacionesAula($hoy, false))->find($alumno->id_aula);

        return $aula ? collect([['enrollment' => null, 'aula' => $aula]]) : collect();
    }

    private function relacionesAula(string $hoy, bool $desdeMatricula = true): array
    {
        $prefijo = $desdeMatricula ? 'aula.' : '';

        return [
            $prefijo.'curso',
            $prefijo.'periodoAcademico',
            $prefijo.'matriculas' => fn ($query) => $query
                ->where('rol', 'teacher')
                ->where('estado', 'active')
                ->where(fn (Builder $query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', $hoy))
                ->where(fn (Builder $query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', $hoy))
                ->with('usuario:id,nombre_completo'),
        ];
    }

    /**
     * @param  Collection<int, array{enrollment: MatriculaAula|null, aula: Aula}>  $contextos
     * @return Collection<int, SesionAprendizaje>
     */
    private function sesionesEnRango(
        Collection $contextos,
        CarbonImmutable $inicio,
        CarbonImmutable $fin,
        bool $soloProgramadas = false,
    ): Collection {
        if ($contextos->isEmpty()) {
            return collect();
        }

        $ventanas = $contextos->map(function (array $contexto) use ($inicio, $fin): ?array {
            /** @var MatriculaAula|null $matricula */
            $matricula = $contexto['enrollment'];
            $desde = $matricula?->fecha_inicio
                ? CarbonImmutable::instance($matricula->fecha_inicio)->utc()->startOfDay()->max($inicio)
                : $inicio;
            $hasta = $matricula?->fecha_fin
                ? CarbonImmutable::instance($matricula->fecha_fin)->utc()->addDay()->startOfDay()->min($fin)
                : $fin;

            return $desde->lessThan($hasta)
                ? ['aula' => $contexto['aula']->id, 'desde' => $desde, 'hasta' => $hasta]
                : null;
        })->filter()->values();

        if ($ventanas->isEmpty()) {
            return collect();
        }

        return SesionAprendizaje::query()
            ->with(['aula.curso', 'aula.periodoAcademico'])
            ->where(function (Builder $query) use ($ventanas): void {
                foreach ($ventanas as $ventana) {
                    $query->orWhere(function (Builder $query) use ($ventana): void {
                        $query->where('id_aula', $ventana['aula'])
                            ->where('inicio_at', '>=', $ventana['desde'])
                            ->where('inicio_at', '<', $ventana['hasta']);
                    });
                }
            })
            ->when($soloProgramadas, fn (Builder $query) => $query->where('estado', 'scheduled'))
            ->orderBy('inicio_at')
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  Collection<int, array{enrollment: MatriculaAula|null, aula: Aula}>  $contextos
     */
    private function siguienteAccion(Usuario $alumno, Collection $contextos, ?SesionAprendizaje $siguienteLive): ?array
    {
        $cursos = $contextos
            ->map(fn (array $contexto): ?Curso => $this->cursoPublicado($contexto))
            ->filter()
            ->unique('id')
            ->values();

        if ($cursos->isNotEmpty()) {
            $ordenCurso = $cursos->pluck('id')->values();
            $fragmentos = $ordenCurso->map(fn (int $id, int $indice): string => 'WHEN ? THEN '.$indice)->implode(' ');

            $leccion = Leccion::query()
                ->select('lecciones.*')
                ->join('unidades_curso', 'unidades_curso.id', '=', 'lecciones.id_unidad')
                ->whereIn('unidades_curso.id_curso', $ordenCurso)
                ->where('unidades_curso.estado', 'published')
                ->where('lecciones.estado', 'published')
                ->whereDoesntHave('progresos', fn (Builder $query) => $query
                    ->where('id_alumno', $alumno->id)
                    ->where('estado', 'completed'))
                ->with(['unidad.curso', 'progresos' => fn ($query) => $query->where('id_alumno', $alumno->id)])
                ->orderByRaw("CASE unidades_curso.id_curso {$fragmentos} ELSE 999 END", $ordenCurso->all())
                ->orderBy('unidades_curso.orden')
                ->orderBy('lecciones.orden')
                ->first();

            if ($leccion) {
                $contexto = $contextos->first(fn (array $contexto): bool => $this->cursoPublicado($contexto)?->id === $leccion->unidad->id_curso);
                $progreso = $leccion->progresos->first();

                return [
                    'type' => 'lesson',
                    'title' => $leccion->titulo,
                    'lesson' => [
                        'id' => $leccion->id,
                        'durationMinutes' => $leccion->duracion_minutos,
                        'progressState' => $progreso?->estado ?? 'notStarted',
                    ],
                    'course' => $this->cursoResumen($leccion->unidad->curso),
                    'cohort' => $contexto ? $this->aulaResumen($contexto['aula']) : null,
                ];
            }
        }

        return $siguienteLive ? [
            'type' => 'live_session',
            'title' => $siguienteLive->titulo,
            'session' => $this->sesionRespuesta($siguienteLive),
        ] : null;
    }

    /**
     * @param  Collection<int, array{enrollment: MatriculaAula|null, aula: Aula}>  $contextos
     * @return array<int, array{lessonCount: int, completedLessonCount: int, lessonProgressPercent: int}>
     */
    private function progresoPorCurso(Usuario $alumno, Collection $contextos): array
    {
        $cursoIds = $contextos
            ->map(fn (array $contexto): ?int => $this->cursoPublicado($contexto)?->id)
            ->filter()
            ->unique()
            ->values();

        if ($cursoIds->isEmpty()) {
            return [];
        }

        $totales = Leccion::query()
            ->join('unidades_curso', 'unidades_curso.id', '=', 'lecciones.id_unidad')
            ->whereIn('unidades_curso.id_curso', $cursoIds)
            ->where('unidades_curso.estado', 'published')
            ->where('lecciones.estado', 'published')
            ->selectRaw('unidades_curso.id_curso as curso_id, COUNT(lecciones.id) as total')
            ->groupBy('unidades_curso.id_curso')
            ->pluck('total', 'curso_id');

        $completadas = ProgresoLeccion::query()
            ->join('lecciones', 'lecciones.id', '=', 'progresos_leccion.id_leccion')
            ->join('unidades_curso', 'unidades_curso.id', '=', 'lecciones.id_unidad')
            ->where('progresos_leccion.id_alumno', $alumno->id)
            ->where('progresos_leccion.estado', 'completed')
            ->where('unidades_curso.estado', 'published')
            ->where('lecciones.estado', 'published')
            ->whereIn('unidades_curso.id_curso', $cursoIds)
            ->selectRaw('unidades_curso.id_curso as curso_id, COUNT(progresos_leccion.id) as total')
            ->groupBy('unidades_curso.id_curso')
            ->pluck('total', 'curso_id');

        return $cursoIds->mapWithKeys(function (int $cursoId) use ($totales, $completadas): array {
            $total = (int) ($totales[$cursoId] ?? 0);
            $completado = (int) ($completadas[$cursoId] ?? 0);

            return [$cursoId => [
                'lessonCount' => $total,
                'completedLessonCount' => $completado,
                'lessonProgressPercent' => $total > 0 ? (int) round($completado * 100 / $total) : 0,
            ]];
        })->all();
    }

    /** @param array{enrollment: MatriculaAula|null, aula: Aula} $contexto */
    private function matriculaRespuesta(array $contexto): array
    {
        /** @var MatriculaAula|null $matricula */
        $matricula = $contexto['enrollment'];

        return [
            'id' => $matricula?->id,
            'status' => 'active',
            'isPrimary' => $matricula?->es_principal ?? true,
            'startsOn' => $matricula?->fecha_inicio?->toDateString(),
            'endsOn' => $matricula?->fecha_fin?->toDateString(),
            'course' => $this->cursoResumen($this->cursoPublicado($contexto)),
            'cohort' => $this->aulaResumen($contexto['aula']),
        ];
    }

    /** @param array{enrollment: MatriculaAula|null, aula: Aula} $contexto */
    private function cursoPublicado(array $contexto): ?Curso
    {
        $curso = $contexto['aula']->curso;

        return $curso?->estado === 'published' ? $curso : null;
    }

    private function alumnoResumen(Usuario $alumno): array
    {
        return ['id' => $alumno->id, 'name' => $alumno->nombre_completo];
    }

    private function cursoResumen(?Curso $curso): ?array
    {
        return $curso ? [
            'id' => $curso->id,
            'title' => $curso->titulo,
            'code' => $curso->codigo,
            'version' => $curso->version,
        ] : null;
    }

    private function aulaResumen(Aula $aula): array
    {
        $periodo = $aula->periodoAcademico;
        $docente = $aula->relationLoaded('matriculas')
            ? $aula->matriculas->first()?->usuario
            : null;

        return [
            'id' => $aula->id,
            'name' => $aula->nombre,
            'code' => $aula->codigo,
            'teacher' => $docente ? ['id' => $docente->id, 'name' => $docente->nombre_completo] : null,
            'period' => $periodo ? [
                'id' => $periodo->id,
                'title' => $periodo->titulo,
                'startsOn' => $periodo->fecha_inicio?->toDateString(),
                'endsOn' => $periodo->fecha_fin?->toDateString(),
            ] : null,
        ];
    }

    private function sesionRespuesta(SesionAprendizaje $sesion): array
    {
        $curso = $sesion->aula?->curso;

        return [
            'id' => $sesion->id,
            'type' => 'live_session',
            'title' => $sesion->titulo,
            'course' => $this->cursoResumen($curso?->estado === 'published' ? $curso : null),
            'cohort' => $sesion->aula ? [
                'id' => $sesion->aula->id,
                'name' => $sesion->aula->nombre,
                'code' => $sesion->aula->codigo,
            ] : null,
            'startsAt' => $sesion->inicio_at->utc()->toIso8601ZuluString(),
            'endsAt' => $sesion->fin_at?->utc()->toIso8601ZuluString(),
            'durationMinutes' => $sesion->fin_at ? (int) $sesion->inicio_at->diffInMinutes($sesion->fin_at) : null,
            'status' => $sesion->estado,
            'access' => $sesion->estado === 'scheduled' && $sesion->acceso_url
                ? ['joinUrl' => $sesion->acceso_url]
                : null,
        ];
    }

    private function progresoVacio(): array
    {
        return ['lessonCount' => 0, 'completedLessonCount' => 0, 'lessonProgressPercent' => 0];
    }
}
