<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnidadCurso extends ModeloBase
{
    protected $table = 'unidades_curso';

    public $timestamps = true;

    protected $fillable = ['id_curso', 'uuid', 'titulo', 'descripcion', 'orden', 'estado'];

    protected function casts(): array
    {
        return ['orden' => 'integer'];
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function lecciones(): HasMany
    {
        return $this->hasMany(Leccion::class, 'id_unidad')->orderBy('orden');
    }
}
