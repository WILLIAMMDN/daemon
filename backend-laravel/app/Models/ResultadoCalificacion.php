<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultadoCalificacion extends ModeloBase
{
    protected $table = 'resultados_calificacion';

    public $timestamps = true;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'puntaje' => 'decimal:2',
            'puntaje_maximo' => 'decimal:2',
            'porcentaje' => 'decimal:2',
            'entregado_at' => 'datetime',
            'calificado_at' => 'datetime',
            'metadatos' => 'array',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(ItemCalificacion::class, 'id_item_calificacion');
    }

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_alumno');
    }

    public function calificador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_calificador');
    }
}
