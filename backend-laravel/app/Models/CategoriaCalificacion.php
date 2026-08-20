<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaCalificacion extends ModeloBase
{
    protected $table = 'categorias_calificacion';

    public $timestamps = true;

    protected $fillable = ['sourced_id', 'id_institucion', 'titulo', 'tipo', 'estado'];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemCalificacion::class, 'id_categoria');
    }
}
