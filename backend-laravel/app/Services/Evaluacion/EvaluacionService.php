<?php

namespace App\Services\Evaluacion;

use App\Models\Evaluacion;
use App\Models\Pregunta;
use App\Models\RespuestaEvaluacion;
use App\Models\Usuario;
use App\Services\Academico\AcademicScopeService;
use App\Services\Academico\AlineacionAcademicaService;
use App\Services\Academico\LibroCalificacionesService;
use App\Services\Gamificacion\GamificacionService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EvaluacionService
{
    public function __construct(
        private readonly AcademicScopeService $alcance,
        private readonly GamificacionService $gamificacion,
        private readonly AlineacionAcademicaService $alineacion,
        private readonly LibroCalificacionesService $libroCalificaciones,
    ) {}

    public function listadoDocente(Usuario $actor): Collection
    {
        return $this->alineacion->aplicarVisibilidad(Evaluacion::with(['preguntas', 'objetivos']), $actor)
            ->orderByDesc('id')->get()
            ->map(fn ($evaluacion) => [
                ...$evaluacion->toArray(),
                'preguntas' => $evaluacion->preguntas,
            ]);
    }

    public function activasParaNivel(Usuario $alumno): Collection
    {
        return $this->alineacion->aplicarVisibilidad(Evaluacion::with(['preguntas', 'objetivos']), $alumno)
            ->where('nivel', $alumno->nivel)->where('estado', 'activo')->get()
            ->map(fn ($evaluacion) => [
                ...$evaluacion->toArray(),
                'preguntas' => $evaluacion->preguntas->map(fn ($pregunta) => $pregunta->makeHidden('respuesta_correcta')),
            ]);
    }

    public function crear(Usuario $actor, array $datos): Evaluacion
    {
        $resuelto = $this->alineacion->resolver($actor, $datos);

        return DB::transaction(function () use ($resuelto): Evaluacion {
            $evaluacion = Evaluacion::create($resuelto['datos']);
            $evaluacion->objetivos()->sync($resuelto['objetivos'] ?? []);
            $this->libroCalificaciones->sincronizarActividad($evaluacion);

            return $evaluacion->fresh('objetivos');
        });
    }

    public function actualizar(Usuario $actor, Evaluacion $evaluacion, array $datos): Evaluacion
    {
        $this->alineacion->autorizarGestion($actor, $evaluacion);
        $resuelto = $this->alineacion->resolver($actor, $datos, $evaluacion);
        $datos = $resuelto['datos'];
        DB::transaction(function () use ($evaluacion, $datos, $resuelto): void {
            if (($datos['estado'] ?? null) === 'activo') {
                Evaluacion::where('nivel', $datos['nivel'] ?? $evaluacion->nivel)
                    ->where('id_institucion', $datos['id_institucion'])
                    ->where('id_aula', $datos['id_aula'])
                    ->where('id', '!=', $evaluacion->id)
                    ->update(['estado' => 'finalizado']);
            }
            $evaluacion->update($datos);
            if ($resuelto['objetivos'] !== null) {
                $evaluacion->objetivos()->sync($resuelto['objetivos']);
            }
            $this->libroCalificaciones->sincronizarActividad($evaluacion->fresh());
        });

        return $evaluacion->fresh('objetivos');
    }

    public function eliminar(Usuario $actor, Evaluacion $evaluacion): void
    {
        $this->alineacion->autorizarGestion($actor, $evaluacion);
        DB::transaction(function () use ($evaluacion) {
            RespuestaEvaluacion::where('examen_id', $evaluacion->id)->delete();
            Pregunta::where('examen_id', $evaluacion->id)->delete();
            $this->libroCalificaciones->eliminarActividad($evaluacion);
            $evaluacion->delete();
        });
    }

    public function publicar(Usuario $actor, Evaluacion $evaluacion): Evaluacion
    {
        $this->alineacion->autorizarGestion($actor, $evaluacion);
        abort_if(
            $evaluacion->preguntas()->count() === 0,
            422,
            'La evaluacion necesita al menos una pregunta antes de publicarse.'
        );

        return DB::transaction(function () use ($evaluacion) {
            Evaluacion::where('nivel', $evaluacion->nivel)
                ->where('id_institucion', $evaluacion->id_institucion)
                ->where('id_aula', $evaluacion->id_aula)
                ->where('id', '!=', $evaluacion->id)
                ->where('estado', 'activo')
                ->update(['estado' => 'finalizado']);

            $evaluacion->estado = 'activo';
            $evaluacion->save();
            $this->libroCalificaciones->sincronizarActividad($evaluacion);

            return $evaluacion->fresh('objetivos');
        });
    }

    public function despublicar(Usuario $actor, Evaluacion $evaluacion): Evaluacion
    {
        $this->alineacion->autorizarGestion($actor, $evaluacion);
        abort_if(
            $evaluacion->estado !== 'activo',
            422,
            'Solo se pueden despublicar evaluaciones activas.'
        );

        $evaluacion->estado = 'borrador';
        $evaluacion->save();
        $this->libroCalificaciones->sincronizarActividad($evaluacion);

        return $evaluacion->fresh('objetivos');
    }

    public function guardarPreguntas(Usuario $actor, Evaluacion $evaluacion, array $preguntas): void
    {
        $this->alineacion->autorizarGestion($actor, $evaluacion);
        DB::transaction(function () use ($evaluacion, $preguntas) {
            Pregunta::where('examen_id', $evaluacion->id)->delete();

            foreach ($preguntas as $orden => $pregunta) {
                Pregunta::create([...$pregunta, 'examen_id' => $evaluacion->id, 'orden' => $orden + 1]);
            }
        });
    }

    public function responder(Usuario $alumno, Evaluacion $evaluacion, array $respuestas): array
    {
        $visible = $this->alineacion->aplicarVisibilidad(Evaluacion::query()->whereKey($evaluacion->id), $alumno)->exists();
        abort_unless($visible && $evaluacion->estado === 'activo' && $evaluacion->nivel === $alumno->nivel, 422, 'Evaluacion no disponible.');

        return DB::transaction(function () use ($alumno, $evaluacion, $respuestas): array {
            $preguntas = Pregunta::where('examen_id', $evaluacion->id)->get();
            $correctas = $preguntas
                ->filter(fn ($pregunta) => mb_strtolower(trim((string) ($respuestas[$pregunta->id] ?? ''))) === mb_strtolower(trim((string) $pregunta->respuesta_correcta)))
                ->count();
            $puntaje = $preguntas->count() ? (int) round($correctas * 100 / $preguntas->count()) : 0;
            $anterior = RespuestaEvaluacion::where('alumno_id', $alumno->id)
                ->where('examen_id', $evaluacion->id)
                ->lockForUpdate()
                ->first();

            RespuestaEvaluacion::upsert([[
                'alumno_id' => $alumno->id,
                'examen_id' => $evaluacion->id,
                'nivel' => $alumno->nivel,
                'respuestas' => json_encode($respuestas, JSON_THROW_ON_ERROR),
                'puntaje' => $puntaje,
                'fecha_envio' => now(),
            ]], ['alumno_id', 'examen_id'], ['nivel', 'respuestas', 'puntaje', 'fecha_envio']);
            $registro = RespuestaEvaluacion::where('alumno_id', $alumno->id)
                ->where('examen_id', $evaluacion->id)
                ->firstOrFail();

            if (! $anterior && $puntaje >= 70) {
                $this->gamificacion->otorgarRecompensa(
                    $alumno,
                    100,
                    'evaluacion_aprobada',
                    $registro->id,
                    null,
                    "evaluacion:{$evaluacion->id}:alumno:{$alumno->id}:primera-aprobacion",
                    "Evaluación aprobada: {$evaluacion->titulo}",
                );
            }

            $this->libroCalificaciones->registrarResultado(
                $evaluacion,
                $alumno,
                $puntaje,
                null,
                null,
                'respuesta_evaluacion',
                $registro->id,
                $registro->fecha_envio,
            );

            return ['resultado' => $registro, 'correctas' => $correctas, 'total' => $preguntas->count()];
        });
    }

    public function resultados(Usuario $usuario): Collection
    {
        $query = DB::table('respuestas_examen as r')
            ->join('examenes as e', 'e.id', '=', 'r.examen_id')
            ->join('usuarios as u', 'u.id', '=', 'r.alumno_id')
            ->select('r.*', 'e.titulo', 'u.nombre_completo as alumno');

        if ($usuario->rol === 'alumno') {
            $query->where('r.alumno_id', $usuario->id);
        } elseif ($usuario->rol === 'docente') {
            $this->alcance->aplicarAlumnosQuery($query, $usuario, 'u.id_aula');
            $evaluacionesVisibles = $this->alineacion
                ->aplicarVisibilidad(Evaluacion::query(), $usuario)
                ->select('examenes.id');
            $query->whereIn('e.id', $evaluacionesVisibles);
        }

        return $query->orderByDesc('r.fecha_envio')->get();
    }
}
