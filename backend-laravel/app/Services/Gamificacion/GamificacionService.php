<?php

namespace App\Services\Gamificacion;

use App\Models\Usuario;

class GamificacionService
{
    public const NIVEL_MAXIMO = 100;

    public const XP_BASE = 100;

    /**
     * Suma una recompensa dual. La experiencia representa progreso historico
     * y los tokens representan saldo gastable.
     */
    public function otorgarRecompensa(Usuario $usuario, int $cantidad): Usuario
    {
        if ($cantidad <= 0) {
            return $usuario;
        }

        $usuario->increment('experiencia', $cantidad);
        $usuario->increment('tokens', $cantidad);

        return $usuario->refresh();
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
        $nivel = 1;

        while ($nivel < self::NIVEL_MAXIMO && $experiencia >= $this->xpAcumuladaParaNivel($nivel + 1)) {
            $nivel++;
        }

        $inicio = $this->xpAcumuladaParaNivel($nivel);
        $fin = $nivel === self::NIVEL_MAXIMO
            ? $inicio
            : $this->xpAcumuladaParaNivel($nivel + 1);
        $meta = max(0, $fin - $inicio);
        $avance = max(0, $experiencia - $inicio);
        $porcentaje = $nivel === self::NIVEL_MAXIMO
            ? 100
            : (int) min(100, round(($avance / max(1, $meta)) * 100));

        return [
            'nivel' => $nivel,
            'nivel_maximo' => self::NIVEL_MAXIMO,
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

        return (int) (self::XP_BASE * $saltos * ($saltos + 1) / 2);
    }
}
