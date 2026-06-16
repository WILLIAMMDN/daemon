<?php

namespace App\Models;

class HistorialMovimiento extends ModeloBase
{
    protected $table = 'historial_movimientos';

    protected function casts(): array { return ['fecha' => 'datetime']; }
}
