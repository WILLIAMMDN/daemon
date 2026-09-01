<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SesionAprendizaje extends ModeloBase
{
    protected $table = 'sesiones_aprendizaje';

    public $timestamps = true;

    protected $fillable = [
        'uuid',
        'id_aula',
        'id_creador',
        'titulo',
        'descripcion',
        'tipo',
        'inicio_at',
        'fin_at',
        'estado',
        'acceso_url',
    ];

    protected function casts(): array
    {
        return [
            'inicio_at' => 'immutable_datetime',
            'fin_at' => 'immutable_datetime',
        ];
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_creador');
    }
}
