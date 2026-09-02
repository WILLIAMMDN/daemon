<?php

namespace App\Models;

use LogicException;

class InsigniaOtorgada extends ModeloBase
{
    protected $table = 'insignias_otorgadas';

    protected function casts(): array
    {
        return ['fecha' => 'datetime', 'contexto' => 'array'];
    }

    protected static function booted(): void
    {
        static::updating(function (InsigniaOtorgada $otorgamiento): void {
            if ($otorgamiento->clave_idempotencia) {
                throw new LogicException('Los logros automáticos Pulse son inmutables.');
            }
        });
        static::deleting(function (InsigniaOtorgada $otorgamiento): void {
            if ($otorgamiento->clave_idempotencia) {
                throw new LogicException('Los logros automáticos Pulse no se eliminan.');
            }
        });
    }
}
