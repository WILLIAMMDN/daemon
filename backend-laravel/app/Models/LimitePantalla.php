<?php

namespace App\Models;

class LimitePantalla extends ModeloBase
{
    protected $table = 'limites_pantalla';

    public $timestamps = true;

    protected function casts(): array
    {
        return [
            'max_minutos_diarios' => 'integer',
            'activo' => 'boolean',
        ];
    }
}
