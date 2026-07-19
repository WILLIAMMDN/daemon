<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curso extends ModeloBase
{
    protected $table = 'cursos';

    public $timestamps = true;

    protected $fillable = ['id_institucion', 'sourced_id', 'titulo', 'codigo', 'descripcion', 'nivel', 'version', 'estado', 'publicado_at'];

    protected function casts(): array
    {
        return ['version' => 'integer', 'publicado_at' => 'datetime'];
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function unidades(): HasMany
    {
        return $this->hasMany(UnidadCurso::class, 'id_curso')->orderBy('orden');
    }

    public function aulas(): HasMany
    {
        return $this->hasMany(Aula::class, 'id_curso');
    }
}
