<?php

namespace App\Services\Economia;

use App\Models\MovimientoEconomia;
use App\Models\Usuario;
use App\Services\Eventos\OutboxService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EconomiaService
{
    public const MONEDA_XP = 'xp';

    public const MONEDA_DAEMONS = 'daemons';

    public function __construct(private readonly OutboxService $outbox) {}

    public function otorgarDual(
        Usuario $usuario,
        int $cantidad,
        string $origenTipo,
        string|int|null $origenId = null,
        ?Usuario $actor = null,
        ?string $claveIdempotencia = null,
        ?string $motivo = null,
        array $metadatos = [],
    ): Usuario {
        if ($cantidad <= 0) {
            return $usuario->refresh();
        }

        $claveIdempotencia ??= (string) Str::uuid();

        return DB::transaction(function () use ($usuario, $cantidad, $origenTipo, $origenId, $actor, $claveIdempotencia, $motivo, $metadatos): Usuario {
            $bloqueado = Usuario::lockForUpdate()->findOrFail($usuario->id);
            $this->aplicarBloqueado($bloqueado, self::MONEDA_XP, $cantidad, $origenTipo, $origenId, $actor, "{$claveIdempotencia}:xp", $motivo, $metadatos);
            $this->aplicarBloqueado($bloqueado, self::MONEDA_DAEMONS, $cantidad, $origenTipo, $origenId, $actor, "{$claveIdempotencia}:daemons", $motivo, $metadatos);

            return $bloqueado->refresh();
        }, 3);
    }

    public function ajustarDaemons(
        Usuario $usuario,
        int $variacion,
        string $origenTipo,
        string|int|null $origenId = null,
        ?Usuario $actor = null,
        ?string $claveIdempotencia = null,
        ?string $motivo = null,
        array $metadatos = [],
    ): Usuario {
        $claveIdempotencia ??= (string) Str::uuid();

        return DB::transaction(function () use ($usuario, $variacion, $origenTipo, $origenId, $actor, $claveIdempotencia, $motivo, $metadatos): Usuario {
            $bloqueado = Usuario::lockForUpdate()->findOrFail($usuario->id);
            $this->aplicarBloqueado($bloqueado, self::MONEDA_DAEMONS, $variacion, $origenTipo, $origenId, $actor, $claveIdempotencia, $motivo, $metadatos);

            return $bloqueado->refresh();
        }, 3);
    }

    private function aplicarBloqueado(
        Usuario $usuario,
        string $moneda,
        int $variacion,
        string $origenTipo,
        string|int|null $origenId,
        ?Usuario $actor,
        string $claveIdempotencia,
        ?string $motivo,
        array $metadatos,
    ): void {
        if (MovimientoEconomia::where('clave_idempotencia', $claveIdempotencia)->exists()) {
            return;
        }

        $columna = $moneda === self::MONEDA_XP ? 'experiencia' : 'tokens';
        $saldoAnterior = (int) $usuario->{$columna};
        $saldoResultante = $saldoAnterior + $variacion;

        abort_if($saldoResultante < 0, 422, $moneda === self::MONEDA_XP
            ? 'La experiencia histórica no puede disminuir.'
            : 'El saldo de DAEMONS no puede quedar negativo.');

        $usuario->forceFill([$columna => $saldoResultante])->save();

        MovimientoEconomia::create([
            'uuid' => (string) Str::uuid(),
            'id_usuario' => $usuario->id,
            'id_actor' => $actor?->id,
            'moneda' => $moneda,
            'variacion' => $variacion,
            'saldo_anterior' => $saldoAnterior,
            'saldo_resultante' => $saldoResultante,
            'origen_tipo' => $origenTipo,
            'origen_id' => $origenId !== null ? (string) $origenId : null,
            'clave_idempotencia' => $claveIdempotencia,
            'motivo' => $motivo,
            'metadatos' => $metadatos ?: null,
        ]);
        $this->outbox->registrar('economia.movimiento_registrado', 'usuario', $usuario->id, [
            'moneda' => $moneda,
            'variacion' => $variacion,
            'saldo_resultante' => $saldoResultante,
            'origen_tipo' => $origenTipo,
            'origen_id' => $origenId !== null ? (string) $origenId : null,
        ]);
    }
}
