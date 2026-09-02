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

    public const TIPO_EARN = 'EARN';

    public const TIPO_SPEND = 'SPEND';

    public const TIPO_ADJUSTMENT = 'ADJUSTMENT';

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
            $this->aplicarBloqueado($bloqueado, self::MONEDA_XP, $cantidad, self::TIPO_EARN, $origenTipo, $origenId, $actor, "{$claveIdempotencia}:xp", $motivo, $metadatos);
            $this->aplicarBloqueado($bloqueado, self::MONEDA_DAEMONS, $cantidad, self::TIPO_EARN, $origenTipo, $origenId, $actor, "{$claveIdempotencia}:daemons", $motivo, $metadatos);

            return $bloqueado->refresh();
        }, 3);
    }

    public function otorgarPulse(
        Usuario $usuario,
        int $xp,
        int $daems,
        string $origenTipo,
        string|int $origenId,
        string $claveIdempotencia,
        int $eventoDominioId,
        int $politicaId,
        ?int $matriculaId,
        array $metadatos = [],
    ): Usuario {
        if ($xp <= 0 && $daems <= 0) {
            return $usuario->refresh();
        }

        return DB::transaction(function () use ($usuario, $xp, $daems, $origenTipo, $origenId, $claveIdempotencia, $eventoDominioId, $politicaId, $matriculaId, $metadatos): Usuario {
            $bloqueado = Usuario::lockForUpdate()->findOrFail($usuario->id);
            if ($xp > 0) {
                $this->aplicarBloqueado(
                    $bloqueado,
                    self::MONEDA_XP,
                    $xp,
                    self::TIPO_EARN,
                    $origenTipo,
                    $origenId,
                    null,
                    "{$claveIdempotencia}:xp",
                    'Recompensa DAEMON Pulse',
                    $metadatos,
                    $eventoDominioId,
                    $politicaId,
                    $matriculaId,
                );
            }
            if ($daems > 0) {
                $this->aplicarBloqueado(
                    $bloqueado,
                    self::MONEDA_DAEMONS,
                    $daems,
                    self::TIPO_EARN,
                    $origenTipo,
                    $origenId,
                    null,
                    "{$claveIdempotencia}:daemons",
                    'Recompensa DAEMON Pulse',
                    $metadatos,
                    $eventoDominioId,
                    $politicaId,
                    $matriculaId,
                );
            }

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
        string $tipoTransaccion = self::TIPO_ADJUSTMENT,
    ): Usuario {
        $claveIdempotencia ??= (string) Str::uuid();

        return DB::transaction(function () use ($usuario, $variacion, $origenTipo, $origenId, $actor, $claveIdempotencia, $motivo, $metadatos, $tipoTransaccion): Usuario {
            $bloqueado = Usuario::lockForUpdate()->findOrFail($usuario->id);
            $this->aplicarBloqueado($bloqueado, self::MONEDA_DAEMONS, $variacion, $tipoTransaccion, $origenTipo, $origenId, $actor, $claveIdempotencia, $motivo, $metadatos);

            return $bloqueado->refresh();
        }, 3);
    }

    private function aplicarBloqueado(
        Usuario $usuario,
        string $moneda,
        int $variacion,
        string $tipoTransaccion,
        string $origenTipo,
        string|int|null $origenId,
        ?Usuario $actor,
        string $claveIdempotencia,
        ?string $motivo,
        array $metadatos,
        ?int $eventoDominioId = null,
        ?int $politicaId = null,
        ?int $matriculaId = null,
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
            'id_evento_dominio' => $eventoDominioId,
            'id_politica_pulse' => $politicaId,
            'id_matricula' => $matriculaId,
            'moneda' => $moneda,
            'tipo_transaccion' => $tipoTransaccion,
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
