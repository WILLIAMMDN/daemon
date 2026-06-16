<?php

namespace App\Models;

class ModeloIa extends ModeloBase
{
    protected $table = 'ia_modelos';

    protected function casts(): array { return ['modelo_json' => 'array', 'fecha_actualizacion' => 'datetime']; }
}
