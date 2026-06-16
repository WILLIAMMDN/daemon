<?php

namespace App\Models;

class Cuento extends ModeloBase
{
    protected $table = 'cuentos';

    protected function casts(): array { return ['fecha_creacion' => 'datetime']; }
}
