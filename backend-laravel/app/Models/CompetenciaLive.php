<?php

namespace App\Models;

class CompetenciaLive extends ModeloBase
{
    protected $table = 'competencia_live';

    protected function casts(): array { return ['fin_votacion' => 'datetime', 'updated_at' => 'datetime']; }
}
