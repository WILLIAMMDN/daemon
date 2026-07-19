<?php

namespace App\Models;

class EventoProducto extends ModeloBase
{
    protected $table = 'eventos_producto';

    const UPDATED_AT = null;

    protected $fillable = ['uuid', 'id_usuario', 'id_institucion', 'nombre', 'sesion_hash', 'propiedades', 'ocurrido_at'];

    protected function casts(): array
    {
        return ['propiedades' => 'array', 'ocurrido_at' => 'datetime', 'created_at' => 'datetime'];
    }
}
