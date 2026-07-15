<?php

namespace App\Models;

class UsoPantallaDiario extends ModeloBase
{
    protected $table = 'uso_pantalla_diario';

    public $timestamps = true;

    protected function casts(): array
    {
        return [
            'fecha_local' => 'immutable_date',
            'segundos_activos' => 'integer',
        ];
    }
}
