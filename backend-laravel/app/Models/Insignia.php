<?php

namespace App\Models;

class Insignia extends ModeloBase
{
    protected $table = 'insignias';

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
            'repetible' => 'boolean',
            'configuracion_criterio' => 'array',
        ];
    }
}
