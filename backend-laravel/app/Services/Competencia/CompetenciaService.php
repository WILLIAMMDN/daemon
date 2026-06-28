<?php

namespace App\Services\Competencia;

use App\Models\ChatLive;
use App\Models\CompetenciaLive;
use App\Models\HistorialRonda;
use App\Models\Usuario;
use App\Models\VotoLive;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CompetenciaService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function ronda(): CompetenciaLive
    {
        return CompetenciaLive::firstOrCreate(['id' => 1], ['estado' => 'espera', 'duracion' => 60]);
    }

    public function estado(Usuario $usuario): array
    {
        $ronda = $this->ronda();
        $candidato = $ronda->id_alumno_en_tarima ? Usuario::find($ronda->id_alumno_en_tarima) : null;
        $promedio = $candidato ? VotoLive::where('id_alumno_candidato', $candidato->id)->avg('puntuacion') : null;
        $miVoto = $candidato
            ? VotoLive::where('id_alumno_juez', $usuario->id)->where('id_alumno_candidato', $candidato->id)->first()
            : null;
        if ($candidato) {
            $candidato->avatar = $this->archivos->url($candidato->avatar);
        }

        return [
            'ronda' => $ronda,
            'candidato' => $candidato,
            'promedio' => $promedio,
            'mi_voto' => $miVoto,
            'servidor' => now()->toIso8601String(),
        ];
    }

    public function chat(): Collection
    {
        return ChatLive::latest('id')->limit(50)->get()->reverse()->values();
    }

    public function enviarChat(Usuario $usuario, string $mensaje): ChatLive
    {
        return ChatLive::create([
            'id_usuario' => $usuario->id,
            'nombre' => $usuario->nombre_completo,
            'mensaje' => $mensaje,
            'rol' => $usuario->rol,
        ]);
    }

    public function votar(Usuario $usuario, array $datos): void
    {
        $ronda = $this->ronda();

        abort_unless($ronda->estado === 'votacion' && $ronda->id_alumno_en_tarima, 422, 'La votacion no esta activa.');
        abort_if($ronda->id_alumno_en_tarima === $usuario->id, 422, 'No puedes votarte a ti mismo.');

        VotoLive::updateOrCreate([
            'id_alumno_juez' => $usuario->id,
            'id_alumno_candidato' => $ronda->id_alumno_en_tarima,
        ], $datos);
    }

    public function controlar(Usuario $docente, array $datos): CompetenciaLive
    {
        return DB::transaction(function () use ($docente, $datos) {
            $this->ronda();
            $ronda = CompetenciaLive::lockForUpdate()->findOrFail(1);

            return match ($datos['accion']) {
                'candidato' => $this->seleccionarCandidato($ronda, $datos),
                'iniciar' => $this->iniciarVotacion($ronda, $datos),
                'cerrar' => $this->cerrarVotacion($ronda),
                'premiar' => $this->premiar($ronda, $docente, $datos),
                default => $this->reiniciar($ronda),
            };
        });
    }

    public function historial(): Collection
    {
        return HistorialRonda::orderByDesc('fecha')->get();
    }

    private function seleccionarCandidato(CompetenciaLive $ronda, array $datos): CompetenciaLive
    {
        if (! empty($datos['id_alumno'])) {
            Usuario::where('rol', 'alumno')->findOrFail($datos['id_alumno']);
        }

        VotoLive::query()->delete();
        $ronda->update(['id_alumno_en_tarima' => $datos['id_alumno'], 'estado' => 'espera', 'fin_votacion' => null]);

        return $ronda->fresh();
    }

    private function iniciarVotacion(CompetenciaLive $ronda, array $datos): CompetenciaLive
    {
        abort_unless($ronda->id_alumno_en_tarima, 422, 'Selecciona un alumno.');

        $duracion = $datos['duracion'] ?? $ronda->duracion ?? 60;
        $ronda->update(['estado' => 'votacion', 'duracion' => $duracion, 'fin_votacion' => now()->addSeconds($duracion)]);

        return $ronda->fresh();
    }

    private function cerrarVotacion(CompetenciaLive $ronda): CompetenciaLive
    {
        $ronda->update([
            'estado' => 'cerrado',
            'promedio_alumnos' => VotoLive::where('id_alumno_candidato', $ronda->id_alumno_en_tarima)->avg('puntuacion') ?: 0,
        ]);

        return $ronda->fresh();
    }

    private function premiar(CompetenciaLive $ronda, Usuario $docente, array $datos): CompetenciaLive
    {
        $alumno = Usuario::findOrFail($ronda->id_alumno_en_tarima);
        $puntos = $datos['puntos'] ?? (int) round(((float) $ronda->promedio_alumnos) * 10);

        $alumno->increment('tokens', $puntos);
        DB::table('historial_movimientos')->insert([
            'id_docente' => $docente->id,
            'id_alumno' => $alumno->id,
            'cantidad' => $puntos,
            'id_operador' => $docente->id,
            'motivo' => 'Premio de competencia',
        ]);

        HistorialRonda::create([
            'nivel' => $alumno->nivel,
            'ganador_nombre' => $alumno->nombre_completo,
            'ganador_promedio' => $ronda->promedio_alumnos,
            'top_ranking' => VotoLive::where('id_alumno_candidato', $alumno->id)->orderByDesc('puntuacion')->limit(10)->get()->toArray(),
        ]);

        $ronda->update(['estado' => 'espera', 'id_alumno_en_tarima' => null, 'fin_votacion' => null]);

        return $ronda->fresh();
    }

    private function reiniciar(CompetenciaLive $ronda): CompetenciaLive
    {
        VotoLive::query()->delete();
        ChatLive::query()->delete();
        $ronda->update(['estado' => 'espera', 'id_alumno_en_tarima' => null, 'fin_votacion' => null, 'promedio_alumnos' => 0]);

        return $ronda->fresh();
    }
}
