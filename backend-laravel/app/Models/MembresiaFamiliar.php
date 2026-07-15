<?php

namespace App\Models;

class MembresiaFamiliar extends ModeloBase
{
    protected $table = 'membresias_familiares';

    public $timestamps = true;

    protected function casts(): array
    {
        return [
            'importe_centimos' => 'integer',
            'ultimo_pago_at' => 'immutable_datetime',
            'proximo_pago_at' => 'immutable_datetime',
        ];
    }
}
