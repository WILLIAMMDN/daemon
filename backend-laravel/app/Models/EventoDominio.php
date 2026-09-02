<?php

namespace App\Models;

class EventoDominio extends ModeloBase
{
    protected $table = 'eventos_dominio';

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'ocurrido_at' => 'datetime',
            'publicado_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
