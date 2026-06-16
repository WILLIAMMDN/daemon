<?php

namespace App\Models;

class Evaluacion extends ModeloBase
{
    protected $table = 'examenes';

    protected function casts(): array { return ['fecha_creacion' => 'datetime']; }
}
