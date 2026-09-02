<?php

namespace App\Services\Pulse;

use App\Models\EventoDominio;
use App\Models\Insignia;
use App\Models\RachaPulse;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class EvaluadorLogrosPulse
{
    public function evaluar(EventoDominio $evento, Usuario $usuario): int
    {
        $otorgados = 0;
        foreach (Insignia::query()->where('activa', true)->whereNotNull('tipo_criterio')->orderBy('id')->get() as $logro) {
            if (! $this->cumple($logro, $evento, $usuario)) {
                continue;
            }

            $clave = $logro->repetible
                ? "pulse:achievement:{$logro->id}:player:{$usuario->id}:event:{$evento->id}"
                : "pulse:achievement:{$logro->id}:player:{$usuario->id}";
            $insertado = DB::table('insignias_otorgadas')->insertOrIgnore([
                'id_alumno' => $usuario->id,
                'id_insignia' => $logro->id,
                'fecha' => now(),
                'clave_idempotencia' => $clave,
                'id_evento_dominio' => $evento->id,
                'contexto' => json_encode([
                    'domainEventUuid' => $evento->uuid,
                    'domainEventType' => $evento->tipo,
                    'achievementKey' => $logro->clave_pulse,
                ], JSON_THROW_ON_ERROR),
            ]);
            $otorgados += $insertado === 1 ? 1 : 0;
        }

        return $otorgados;
    }

    private function cumple(Insignia $logro, EventoDominio $evento, Usuario $usuario): bool
    {
        $config = $logro->configuracion_criterio ?? [];
        $tipos = $config['tipos_evento'] ?? [];
        $umbral = max(1, (int) ($config['umbral'] ?? 1));

        return match ($logro->tipo_criterio) {
            'first_completion' => in_array($evento->tipo, $tipos ?: [
                'learning.experience.completed',
                'learning.course.completed',
                'learning.path.completed',
            ], true),
            'course_completion' => $evento->tipo === 'learning.course.completed',
            'path_completion' => $evento->tipo === 'learning.path.completed',
            'event_count' => $this->conteoEventos($evento, $usuario, $tipos ?: [$evento->tipo]) >= $umbral,
            'milestone_count' => $evento->tipo === 'learning.milestone.completed'
                && $this->conteoEventos($evento, $usuario, ['learning.milestone.completed']) >= $umbral,
            'streak_threshold' => $this->rachaActual($usuario) >= $umbral,
            default => false,
        };
    }

    /** @param array<int, string> $tipos */
    private function conteoEventos(EventoDominio $evento, Usuario $usuario, array $tipos): int
    {
        if (! in_array($evento->tipo, $tipos, true)) {
            return 0;
        }

        return DB::table('eventos_dominio')
            ->where('id_alumno', $usuario->id)
            ->where('id', '<=', $evento->id)
            ->whereIn('tipo', $tipos)
            ->count();
    }

    private function rachaActual(Usuario $usuario): int
    {
        return (int) (RachaPulse::where('id_usuario', $usuario->id)->value('racha_actual') ?? 0);
    }
}
