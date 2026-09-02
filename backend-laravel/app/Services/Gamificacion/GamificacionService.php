<?php

namespace App\Services\Gamificacion;

use App\Models\Usuario;
use App\Services\Economia\EconomiaService;

class GamificacionService
{
    public function __construct(private readonly EconomiaService $economia) {}

    /**
     * Suma una recompensa dual. La experiencia representa progreso historico
     * y los tokens representan saldo gastable.
     */
    public function otorgarRecompensa(
        Usuario $usuario,
        int $cantidad,
        string $origenTipo = 'recompensa',
        string|int|null $origenId = null,
        ?Usuario $actor = null,
        ?string $claveIdempotencia = null,
        ?string $motivo = null,
    ): Usuario {
        if ($cantidad <= 0) {
            return $usuario;
        }

        return $this->economia->otorgarDual(
            $usuario,
            $cantidad,
            $origenTipo,
            $origenId,
            $actor,
            $claveIdempotencia,
            $motivo,
        );
    }

    /**
     * Curva progresiva: cada nivel exige 100 XP mas que el anterior.
     * El nivel 100 es el tope visual, pero la XP total nunca se pierde.
     *
     * @return array<string, int>
     */
    public function progreso(int $experiencia): array
    {
        $experiencia = max(0, $experiencia);
        $nivelMaximo = max(1, (int) config('pulse.level_curve.max_level', 100));
        $nivel = 1;

        while ($nivel < $nivelMaximo && $experiencia >= $this->xpAcumuladaParaNivel($nivel + 1)) {
            $nivel++;
        }

        $inicio = $this->xpAcumuladaParaNivel($nivel);
        $fin = $nivel === $nivelMaximo
            ? $inicio
            : $this->xpAcumuladaParaNivel($nivel + 1);
        $meta = max(0, $fin - $inicio);
        $avance = max(0, $experiencia - $inicio);
        $porcentaje = $nivel === $nivelMaximo
            ? 100
            : (int) min(100, round(($avance / max(1, $meta)) * 100));

        return [
            'nivel' => $nivel,
            'nivel_maximo' => $nivelMaximo,
            'experiencia_total' => $experiencia,
            'experiencia_nivel' => $avance,
            'experiencia_meta' => $meta,
            'experiencia_restante' => max(0, $meta - $avance),
            'progreso_porcentaje' => $porcentaje,
        ];
    }

    private function xpAcumuladaParaNivel(int $nivel): int
    {
        $saltos = max(0, $nivel - 1);
        $base = max(1, (int) config('pulse.level_curve.base_xp', 100));
        $incremento = max(0, (int) config('pulse.level_curve.increment_xp', 100));

        return (int) ($saltos * (2 * $base + ($saltos - 1) * $incremento) / 2);
    }
}
