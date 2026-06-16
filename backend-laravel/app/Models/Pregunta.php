<?php

namespace App\Models;

class Pregunta extends ModeloBase
{
    protected $table = 'preguntas';

    protected function casts(): array { return ['opciones' => 'array']; }
}
