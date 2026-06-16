<?php

namespace App\Models;

class InsigniaOtorgada extends ModeloBase
{
    protected $table = 'insignias_otorgadas';

    protected function casts(): array { return ['fecha' => 'datetime']; }
}
