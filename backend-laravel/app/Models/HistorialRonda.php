<?php

namespace App\Models;

class HistorialRonda extends ModeloBase
{
    protected $table = 'historial_rondas';

    protected function casts(): array { return ['fecha' => 'datetime', 'top_ranking' => 'array']; }
}
