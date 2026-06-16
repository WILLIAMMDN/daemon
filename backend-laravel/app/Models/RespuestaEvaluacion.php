<?php

namespace App\Models;

class RespuestaEvaluacion extends ModeloBase
{
    protected $table = 'respuestas_examen';

    protected function casts(): array { return ['respuestas' => 'array', 'fecha_envio' => 'datetime']; }
}
