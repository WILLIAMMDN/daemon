<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Mision extends ModeloBase
{
    protected $table = 'desafios';

    protected function casts(): array
    {
        return [
            'es_mision_nivel' => 'boolean',
            'fecha_creacion' => 'datetime',
            'puntaje_maximo' => 'integer',
        ];
    }

    public function entregas()
    {
        return $this->hasMany(Entrega::class, 'id_desafio');
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
        return $this->belongsToMany(ObjetivoAprendizaje::class, 'mision_objetivo', 'id_mision', 'id_objetivo');
    }
}
