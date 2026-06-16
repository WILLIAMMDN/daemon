<?php

namespace App\Models;

class Canje extends ModeloBase
{
    protected $table = 'canjes';

    protected function casts(): array { return ['fecha' => 'datetime', 'visto_por_alumno' => 'boolean']; }
}
