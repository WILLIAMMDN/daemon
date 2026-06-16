<?php

namespace App\Models;

class BotAlumno extends ModeloBase
{
    protected $table = 'bots_alumnos';

    protected function casts(): array { return ['matriz_neural' => 'array', 'fecha_creacion' => 'datetime']; }
}
