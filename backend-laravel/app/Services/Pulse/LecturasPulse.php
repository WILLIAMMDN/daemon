<?php

namespace App\Services\Pulse;

use App\Models\MovimientoEconomia;
use App\Models\RachaPulse;
use App\Models\Usuario;
use App\Services\Gamificacion\GamificacionService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LecturasPulse
{
    public function __construct(
        private readonly GamificacionService $gamificacion,
        private readonly ZonaHorariaPulse $zonas,
    ) {}

    public function snapshot(Usuario $usuario): array
    {
        $usuario->refresh();
        $progreso = $this->gamificacion->progreso((int) $usuario->experiencia);

        return [
            'level' => [
                'current' => $progreso['nivel'],
                'maximum' => $progreso['nivel_maximo'],
                'xpWithinLevel' => $progreso['experiencia_nivel'],
                'xpRequiredForNextLevel' => $progreso['experiencia_meta'],
                'xpToNextLevel' => $progreso['experiencia_restante'],
                'progressPercent' => $progreso['progreso_porcentaje'],
            ],
            'xp' => ['total' => (int) $usuario->experiencia],
            'daems' => ['balance' => (int) $usuario->tokens],
            'streak' => $this->racha($usuario),
            'recentAchievements' => $this->logros($usuario, 5),
            'recentTransactions' => $this->movimientosQuery($usuario)->limit(10)->get()->map(fn ($movimiento) => $this->movimiento($movimiento)),
        ];
    }

    public function transacciones(Usuario $usuario, int $porPagina = 25): LengthAwarePaginator
    {
        return $this->movimientosQuery($usuario)
            ->paginate(max(1, min($porPagina, 100)))
            ->through(fn ($movimiento) => $this->movimiento($movimiento));
    }

    public function logros(Usuario $usuario, ?int $limite = null)
    {
        $query = DB::table('insignias_otorgadas as premios')
            ->join('insignias as logros', 'logros.id', '=', 'premios.id_insignia')
            ->where('premios.id_alumno', $usuario->id)
            ->select(
                'premios.id',
                'premios.fecha as awardedAt',
                'premios.contexto as context',
                'logros.clave_pulse as key',
                'logros.nombre as title',
                'logros.descripcion as description',
                'logros.categoria as category',
                'logros.imagen as image',
            )
            ->orderByDesc('premios.fecha')
            ->orderByDesc('premios.id');

        return $limite ? $query->limit($limite)->get() : $query->get();
    }

    private function movimientosQuery(Usuario $usuario)
    {
        return MovimientoEconomia::query()
            ->where('id_usuario', $usuario->id)
            ->select([
                'id', 'uuid', 'moneda', 'tipo_transaccion', 'variacion', 'saldo_resultante',
                'origen_tipo', 'origen_id', 'motivo', 'metadatos', 'created_at',
            ])
            ->orderByDesc('id');
    }

    private function movimiento(MovimientoEconomia $movimiento): array
    {
        $tipo = $movimiento->tipo_transaccion ?: match (true) {
            $movimiento->variacion < 0 => 'SPEND',
            $movimiento->origen_tipo === 'ajuste_manual' => 'ADJUSTMENT',
            default => 'EARN',
        };

        return [
            'id' => $movimiento->uuid,
            'currency' => $movimiento->moneda,
            'type' => $tipo,
            'amount' => abs((int) $movimiento->variacion),
            'signedAmount' => (int) $movimiento->variacion,
            'resultingBalance' => (int) $movimiento->saldo_resultante,
            'sourceType' => $movimiento->origen_tipo,
            'sourceId' => $movimiento->origen_id,
            'reason' => $movimiento->motivo,
            'metadata' => $movimiento->metadatos,
            'occurredAt' => $movimiento->created_at,
        ];
    }

    private function racha(Usuario $usuario): array
    {
        $racha = RachaPulse::where('id_usuario', $usuario->id)->first();
        $zona = $racha?->zona_horaria ?: $this->zonas->resolver($usuario);
        $actual = (int) ($racha?->racha_actual ?? 0);
        if ($racha?->ultima_fecha_local) {
            $hoy = CarbonImmutable::now($zona)->startOfDay();
            $ultima = CarbonImmutable::createFromFormat('!Y-m-d', $racha->ultima_fecha_local->toDateString(), $zona);
            if ($ultima->lessThan($hoy->subDay())) {
                $actual = 0;
            }
        }

        return [
            'current' => $actual,
            'longest' => (int) ($racha?->racha_maxima ?? 0),
            'lastQualifyingDate' => $racha?->ultima_fecha_local?->toDateString(),
            'timezone' => $zona,
        ];
    }
}
