<?php

namespace App\Models;

use LogicException;

class AplicacionPoliticaPulse extends ModeloBase
{
    protected $table = 'pulse_aplicaciones_politica';

    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'fecha_local' => 'date',
            'contexto' => 'array',
            'aplicado_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Las aplicaciones de políticas Pulse son inmutables.'));
        static::deleting(fn () => throw new LogicException('Las aplicaciones de políticas Pulse no se eliminan.'));
    }
}
