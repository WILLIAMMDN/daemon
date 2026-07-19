<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodoAcademico extends ModeloBase
{
    protected $table = 'periodos_academicos';

    public $timestamps = true;

    protected $fillable = ['id_institucion', 'sourced_id', 'titulo', 'tipo', 'fecha_inicio', 'fecha_fin', 'id_padre', 'estado'];

    protected function casts(): array
    {
        return ['fecha_inicio' => 'date', 'fecha_fin' => 'date'];
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function aulas(): HasMany
    {
        return $this->hasMany(Aula::class, 'id_periodo_academico');
    }
}
