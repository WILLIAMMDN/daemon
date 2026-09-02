<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RachaPulse extends Model
{
    protected $table = 'pulse_rachas';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'racha_actual' => 'integer',
            'racha_maxima' => 'integer',
            'ultima_fecha_local' => 'date',
        ];
    }
}
