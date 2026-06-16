<?php

namespace App\Models;

class Entrega extends ModeloBase
{
    protected $table = 'entregas';

    protected function casts(): array { return ['fecha_entrega' => 'datetime']; }
}
