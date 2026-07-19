<?php

namespace App\Services\Academico;

use App\Models\CategoriaCalificacion;
use App\Models\DominioObjetivo;
use App\Models\Evaluacion;
use App\Models\ItemCalificacion;
use App\Models\MatriculaAula;
use App\Models\Mision;
use App\Models\ResultadoCalificacion;
use App\Models\Usuario;
use App\Services\Eventos\OutboxService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LibroCalificacionesService
{
    public function __construct(private readonly OutboxService $outbox) {}

    public function sincronizarActividad(Mision|Evaluacion $actividad): ?ItemCalificacion
    {
        if (! $actividad->id_institucion) {
            return null;
        }

        $actividad->loadMissing('objetivos', 'leccion.unidad.curso', 'aula');
        $tipo = $actividad instanceof Mision ? 'mision' : 'evaluacion';
        $categoria = CategoriaCalificacion::firstOrCreate(
            ['id_institucion' => $actividad->id_institucion, 'titulo' => $tipo === 'mision' ? 'Misiones' : 'Evaluaciones'],
            ['sourced_id' => (string) Str::uuid(), 'tipo' => $tipo, 'estado' => 'active'],
        );
        $cursoId = $actividad->leccion?->unidad?->curso?->id ?? $actividad->aula?->id_curso;

        $item = ItemCalificacion::firstOrNew(['origen_tipo' => $tipo, 'origen_id' => $actividad->id]);
        $objetivosAnteriores = $item->exists ? $item->objetivos()->pluck('objetivos_aprendizaje.id')->map(fn ($id) => (int) $id)->all() : [];
        $item->sourced_id ??= (string) Str::uuid();
        $item->fill([
            'id_institucion' => $actividad->id_institucion,
            'id_curso' => $cursoId,
            'id_aula' => $actividad->id_aula,
            'id_leccion' => $actividad->id_leccion,
            'id_categoria' => $categoria->id,
            'titulo' => $actividad->titulo,
            'descripcion' => $actividad->descripcion ?? null,
            'puntaje_maximo' => max(1, (int) ($actividad->puntaje_maximo ?: 100)),
            'estado' => in_array($actividad->estado, ['activo', 'published'], true) ? 'active' : 'inactive',
            'fecha_asignacion' => $actividad->fecha_creacion ?? now(),
        ])->save();
        $objetivosActuales = $actividad->objetivos->modelKeys();
        $item->objetivos()->sync($objetivosActuales);

        if ($item->exists && $objetivosAnteriores !== $objetivosActuales) {
            $alumnos = Usuario::whereIn('id', $item->resultados()->pluck('id_alumno'))->get();
            foreach ($alumnos as $alumno) {
                foreach (array_unique([...$objetivosAnteriores, ...$objetivosActuales]) as $objetivoId) {
                    $this->recalcularDominio($alumno, (int) $objetivoId);
                }
            }
        }

        return $item->fresh(['categoria', 'objetivos']);
    }

    public function eliminarActividad(Mision|Evaluacion $actividad): void
    {
        $item = ItemCalificacion::with('objetivos')
            ->where('origen_tipo', $actividad instanceof Mision ? 'mision' : 'evaluacion')
            ->where('origen_id', $actividad->id)
            ->first();
        if (! $item) {
            return;
        }

        $objetivos = $item->objetivos->modelKeys();
        $alumnos = Usuario::whereIn('id', $item->resultados()->pluck('id_alumno'))->get();
        $item->delete();
        foreach ($alumnos as $alumno) {
            foreach ($objetivos as $objetivoId) {
                $this->recalcularDominio($alumno, (int) $objetivoId);
            }
        }
    }

    public function registrarResultado(
        Mision|Evaluacion $actividad,
        Usuario $alumno,
        float $porcentaje,
        ?Usuario $calificador,
        ?string $retroalimentacion,
        string $origenResultado,
        int $origenResultadoId,
        ?\DateTimeInterface $entregadoAt = null,
    ): ?ResultadoCalificacion {
        $item = $this->sincronizarActividad($actividad);
        if (! $item) {
            return null;
        }

        abort_unless((int) $alumno->id_institucion === (int) $item->id_institucion, 422, 'El alumno y la actividad pertenecen a instituciones distintas.');
        if ($item->id_aula) {
            $pertenece = (int) $alumno->id_aula === (int) $item->id_aula
                || MatriculaAula::where('id_usuario', $alumno->id)
                    ->where('id_aula', $item->id_aula)
                    ->where('rol', 'student')
                    ->where('estado', 'active')
                    ->exists();
            abort_unless($pertenece, 422, 'El alumno no pertenece al aula de la actividad.');
        }

        $porcentaje = round(max(0, min(100, $porcentaje)), 2);
        $puntajeMaximo = (float) $item->puntaje_maximo;
        $resultado = DB::transaction(function () use ($item, $alumno, $porcentaje, $puntajeMaximo, $calificador, $retroalimentacion, $origenResultado, $origenResultadoId, $entregadoAt): ResultadoCalificacion {
            $resultado = ResultadoCalificacion::firstOrNew([
                'id_item_calificacion' => $item->id,
                'id_alumno' => $alumno->id,
                'intento' => 1,
            ]);
            $resultado->sourced_id ??= (string) Str::uuid();
            $resultado->fill([
                'id_calificador' => $calificador?->id,
                'puntaje' => round($puntajeMaximo * $porcentaje / 100, 2),
                'puntaje_maximo' => $puntajeMaximo,
                'porcentaje' => $porcentaje,
                'estado' => 'fully graded',
                'retroalimentacion' => $retroalimentacion,
                'entregado_at' => $entregadoAt ?? now(),
                'calificado_at' => now(),
                'metadatos' => ['origen_tipo' => $origenResultado, 'origen_id' => $origenResultadoId],
            ])->save();

            foreach ($item->objetivos as $objetivo) {
                $this->recalcularDominio($alumno, $objetivo->id);
            }

            $this->outbox->registrar('academico.resultado_calificado', 'resultado_calificacion', $resultado->id, [
                'id_institucion' => $item->id_institucion,
                'id_alumno' => $alumno->id,
                'id_item_calificacion' => $item->id,
                'porcentaje' => $porcentaje,
            ]);

            return $resultado;
        });

        return $resultado->fresh(['item.objetivos']);
    }

    public function libro(Usuario $actor, ?int $aulaId = null): array
    {
        if ($actor->rol === 'docente') {
            $aulas = MatriculaAula::where('id_usuario', $actor->id)
                ->where('estado', 'active')
                ->where('rol', 'teacher')
                ->pluck('id_aula')
                ->when($actor->id_aula, fn ($ids) => $ids->push($actor->id_aula))
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();
            abort_if($aulas->isEmpty(), 403, 'El docente no tiene un aula asignada.');
            abort_if($aulaId && ! $aulas->contains($aulaId), 403, 'No puedes consultar otra aula.');
            $aulaId ??= $actor->id_aula ? (int) $actor->id_aula : (int) $aulas->first();
        }

        $items = ItemCalificacion::query()
            ->with([
                'categoria',
                'objetivos',
                'resultados' => fn ($query) => $query->when($aulaId, fn ($resultados) => $resultados
                    ->whereHas('alumno', fn ($alumnos) => $alumnos
                        ->where(fn ($scope) => $scope
                            ->where('id_aula', $aulaId)
                            ->orWhereHas('matriculas', fn ($matriculas) => $matriculas
                                ->where('id_aula', $aulaId)
                                ->where('rol', 'student')
                                ->where('estado', 'active'))))),
                'resultados.alumno:id,nombre_completo,usuario,id_aula',
            ])
            ->when($actor->rol !== 'admin', fn ($query) => $query->where('id_institucion', $actor->id_institucion))
            ->when($aulaId, fn ($query) => $query->where(function ($scope) use ($aulaId): void {
                $scope->whereNull('id_aula')->orWhere('id_aula', $aulaId);
            }))
            ->orderByDesc('fecha_asignacion')
            ->get();

        return [
            'items' => $items,
            'resumen' => [
                'items' => $items->count(),
                'resultados' => $items->sum(fn (ItemCalificacion $item) => $item->resultados->count()),
                'promedio' => round((float) $items->flatMap->resultados->avg('porcentaje'), 2),
            ],
        ];
    }

    public function dominioAlumno(Usuario $alumno): array
    {
        $dominios = DominioObjetivo::with('objetivo:id,codigo,descripcion,marco,nivel')
            ->where('id_alumno', $alumno->id)
            ->orderByDesc('calculado_at')
            ->get();

        return [
            'objetivos' => $dominios,
            'resumen' => [
                'con_evidencia' => $dominios->count(),
                'dominados' => $dominios->where('nivel_dominio', 'dominado')->count(),
                'promedio' => round((float) $dominios->avg('porcentaje'), 2),
            ],
        ];
    }

    private function recalcularDominio(Usuario $alumno, int $objetivoId): void
    {
        $evidencias = ResultadoCalificacion::query()
            ->join('items_calificacion', 'items_calificacion.id', '=', 'resultados_calificacion.id_item_calificacion')
            ->join('item_calificacion_objetivo', 'item_calificacion_objetivo.id_item_calificacion', '=', 'items_calificacion.id')
            ->where('resultados_calificacion.id_alumno', $alumno->id)
            ->where('item_calificacion_objetivo.id_objetivo', $objetivoId)
            ->where('resultados_calificacion.estado', 'fully graded')
            ->get(['resultados_calificacion.porcentaje', 'resultados_calificacion.calificado_at', 'items_calificacion.ponderacion']);

        if ($evidencias->isEmpty()) {
            DominioObjetivo::where('id_alumno', $alumno->id)->where('id_objetivo', $objetivoId)->delete();

            return;
        }

        $pesoTotal = (float) $evidencias->sum(fn ($evidencia) => max(0.001, (float) $evidencia->ponderacion));
        $porcentaje = round((float) $evidencias->sum(
            fn ($evidencia) => (float) $evidencia->porcentaje * max(0.001, (float) $evidencia->ponderacion)
        ) / $pesoTotal, 2);

        DominioObjetivo::updateOrCreate(
            ['id_objetivo' => $objetivoId, 'id_alumno' => $alumno->id],
            [
                'porcentaje' => $porcentaje,
                'nivel_dominio' => match (true) {
                    $porcentaje >= 90 => 'dominado',
                    $porcentaje >= 75 => 'competente',
                    $porcentaje >= 50 => 'en_desarrollo',
                    default => 'inicial',
                },
                'cantidad_evidencias' => $evidencias->count(),
                'ultima_evidencia_at' => $evidencias->max('calificado_at'),
                'calculado_at' => now(),
            ],
        );
    }
}
