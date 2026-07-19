<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluacion extends ModeloBase
{
    protected $table = 'examenes';

    protected function casts(): array
    {
        return ['fecha_creacion' => 'datetime', 'puntaje_maximo' => 'integer'];
    }

    public function preguntas(): HasMany
    {
        return $this->hasMany(Pregunta::class, 'examen_id')->orderBy('orden');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula');
    }

    public function leccion(): BelongsTo
    {
        return $this->belongsTo(Leccion::class, 'id_leccion');
    }

    public function objetivos(): BelongsToMany
    {
        return $this->belongsToMany(ObjetivoAprendizaje::class, 'evaluacion_objetivo', 'id_evaluacion', 'id_objetivo');
    }
}
