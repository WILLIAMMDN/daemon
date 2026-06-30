<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluacion extends ModeloBase
{
    protected $table = 'examenes';

    protected function casts(): array { return ['fecha_creacion' => 'datetime']; }

    public function preguntas(): HasMany
    {
        return $this->hasMany(Pregunta::class, 'examen_id')->orderBy('orden');
    }
}
