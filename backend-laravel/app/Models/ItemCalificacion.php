<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemCalificacion extends ModeloBase
{
    protected $table = 'items_calificacion';

    public $timestamps = true;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'puntaje_maximo' => 'decimal:2',
            'ponderacion' => 'decimal:3',
            'fecha_asignacion' => 'datetime',
            'fecha_vencimiento' => 'datetime',
        ];
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula');
    }

    public function leccion(): BelongsTo
    {
        return $this->belongsTo(Leccion::class, 'id_leccion');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaCalificacion::class, 'id_categoria');
    }

    public function objetivos(): BelongsToMany
    {
        return $this->belongsToMany(ObjetivoAprendizaje::class, 'item_calificacion_objetivo', 'id_item_calificacion', 'id_objetivo');
    }

    public function resultados(): HasMany
    {
        return $this->hasMany(ResultadoCalificacion::class, 'id_item_calificacion');
    }
}
