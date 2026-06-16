<?php

namespace App\Services\Evaluacion;

use App\Models\Evaluacion;
use App\Models\Pregunta;
use App\Models\RespuestaEvaluacion;
use App\Models\Usuario;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EvaluacionService
{
    public function listadoDocente(): Collection
    {
        return Evaluacion::orderByDesc('id')->get()
            ->map(fn ($evaluacion) => [
                ...$evaluacion->toArray(),
                'preguntas' => Pregunta::where('examen_id', $evaluacion->id)->orderBy('orden')->get(),
            ]);
    }

    public function activasParaNivel(string $nivel): Collection
    {
        return Evaluacion::where('nivel', $nivel)->where('estado', 'activo')->get()
            ->map(fn ($evaluacion) => [
                ...$evaluacion->toArray(),
                'preguntas' => Pregunta::where('examen_id', $evaluacion->id)->orderBy('orden')->get()
                    ->map(fn ($pregunta) => $pregunta->makeHidden('respuesta_correcta')),
            ]);
    }

    public function crear(array $datos): Evaluacion
    {
        return Evaluacion::create($datos);
    }

    public function actualizar(Evaluacion $evaluacion, array $datos): Evaluacion
    {
        if (($datos['estado'] ?? null) === 'activo') {
            Evaluacion::where('nivel', $datos['nivel'] ?? $evaluacion->nivel)
                ->where('id', '!=', $evaluacion->id)
                ->update(['estado' => 'finalizado']);
        }

        $evaluacion->update($datos);

        return $evaluacion->fresh();
    }

    public function eliminar(Evaluacion $evaluacion): void
    {
        DB::transaction(function () use ($evaluacion) {
            RespuestaEvaluacion::where('examen_id', $evaluacion->id)->delete();
            Pregunta::where('examen_id', $evaluacion->id)->delete();
            $evaluacion->delete();
        });
    }

    public function guardarPreguntas(Evaluacion $evaluacion, array $preguntas): void
    {
        DB::transaction(function () use ($evaluacion, $preguntas) {
            Pregunta::where('examen_id', $evaluacion->id)->delete();

            foreach ($preguntas as $orden => $pregunta) {
                Pregunta::create([...$pregunta, 'examen_id' => $evaluacion->id, 'orden' => $orden + 1]);
            }
        });
    }

    public function responder(Usuario $alumno, Evaluacion $evaluacion, array $respuestas): array
    {
        abort_unless($evaluacion->estado === 'activo' && $evaluacion->nivel === $alumno->nivel, 422, 'Evaluacion no disponible.');

        $preguntas = Pregunta::where('examen_id', $evaluacion->id)->get();
        $correctas = $preguntas
            ->filter(fn ($pregunta) => mb_strtolower(trim((string) ($respuestas[$pregunta->id] ?? ''))) === mb_strtolower(trim((string) $pregunta->respuesta_correcta)))
            ->count();
        $puntaje = $preguntas->count() ? (int) round($correctas * 100 / $preguntas->count()) : 0;
        $anterior = RespuestaEvaluacion::where('alumno_id', $alumno->id)->where('examen_id', $evaluacion->id)->first();

        $registro = RespuestaEvaluacion::updateOrCreate(
            ['alumno_id' => $alumno->id, 'examen_id' => $evaluacion->id],
            ['nivel' => $alumno->nivel, 'respuestas' => $respuestas, 'puntaje' => $puntaje, 'fecha_envio' => now()]
        );

        if (! $anterior && $puntaje >= 70) {
            Usuario::whereKey($alumno->id)->increment('tokens', 100);
        }

        return ['resultado' => $registro, 'correctas' => $correctas, 'total' => $preguntas->count()];
    }

    public function resultados(Usuario $usuario): Collection
    {
        $query = DB::table('respuestas_examen as r')
            ->join('examenes as e', 'e.id', '=', 'r.examen_id')
            ->join('usuarios as u', 'u.id', '=', 'r.alumno_id')
            ->select('r.*', 'e.titulo', 'u.nombre_completo as alumno');

        if ($usuario->rol === 'alumno') {
            $query->where('r.alumno_id', $usuario->id);
        }

        return $query->orderByDesc('r.fecha_envio')->get();
    }
}
