<?php

namespace App\Models;

class ProgresoLeccion extends ModeloBase
{
    protected $table = 'progresos_leccion';

    public $timestamps = true;

    protected $fillable = ['id_leccion', 'id_alumno', 'estado', 'porcentaje', 'iniciado_at', 'completado_at', 'evidencia'];

    protected function casts(): array
    {
        return [
            'porcentaje' => 'integer',
            'iniciado_at' => 'datetime',
            'completado_at' => 'datetime',
            'evidencia' => 'array',
        ];
    }
}
