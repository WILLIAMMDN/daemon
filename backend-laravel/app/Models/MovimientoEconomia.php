<?php

namespace App\Models;

use LogicException;

class MovimientoEconomia extends ModeloBase
{
    protected $table = 'movimientos_economia';

    const UPDATED_AT = null;

    protected $fillable = [
        'uuid', 'id_usuario', 'id_actor', 'moneda', 'variacion', 'saldo_anterior', 'saldo_resultante',
        'origen_tipo', 'origen_id', 'clave_idempotencia', 'motivo', 'metadatos',
    ];

    protected function casts(): array
    {
        return ['variacion' => 'integer', 'saldo_anterior' => 'integer', 'saldo_resultante' => 'integer', 'metadatos' => 'array', 'created_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Los movimientos económicos son inmutables.'));
        static::deleting(fn () => throw new LogicException('Los movimientos económicos no se eliminan.'));
    }
}
