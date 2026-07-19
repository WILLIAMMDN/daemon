<?php

namespace App\Models;

class ReporteContenido extends ModeloBase
{
    protected $table = 'reportes_contenido';

    public $timestamps = true;

    protected $fillable = [
        'uuid', 'id_reportante', 'id_usuario_reportado', 'id_asignado', 'tipo_contenido', 'id_contenido',
        'categoria', 'descripcion', 'severidad', 'estado', 'resolucion', 'resuelto_at',
    ];

    protected function casts(): array
    {
        return ['resuelto_at' => 'datetime'];
    }
}
