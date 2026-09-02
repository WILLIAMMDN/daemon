<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcesamientoEventoPulse extends Model
{
    protected $table = 'pulse_procesamientos_evento';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'politicas_aplicadas' => 'integer',
            'logros_otorgados' => 'integer',
            'intentos' => 'integer',
            'procesado_at' => 'datetime',
        ];
    }
}
