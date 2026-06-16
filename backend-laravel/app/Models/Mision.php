<?php

namespace App\Models;

class Mision extends ModeloBase
{
    protected $table = 'desafios';

    protected function casts(): array { return ['es_mision_nivel' => 'boolean', 'fecha_creacion' => 'datetime']; }
}
