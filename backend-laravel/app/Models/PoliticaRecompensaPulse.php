<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoliticaRecompensaPulse extends Model
{
    protected $table = 'pulse_politicas_recompensa';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'xp' => 'integer',
            'daems' => 'integer',
            'limite_diario' => 'integer',
            'actividad_racha' => 'boolean',
            'reglas_elegibilidad' => 'array',
            'activa' => 'boolean',
            'vigente_desde' => 'datetime',
            'vigente_hasta' => 'datetime',
        ];
    }
}
