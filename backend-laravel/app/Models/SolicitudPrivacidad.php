<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudPrivacidad extends Model
{
    protected $table = 'solicitudes_privacidad';

    protected $fillable = [
        'usuario_id',
        'referencia_usuario_hash',
        'tipo',
        'estado',
        'motivo',
        'resolucion',
        'solicitado_at',
        'resuelto_at',
    ];

    protected $hidden = ['referencia_usuario_hash'];

    protected function casts(): array
    {
        return [
            'motivo' => 'encrypted',
            'resolucion' => 'encrypted',
            'solicitado_at' => 'immutable_datetime',
            'resuelto_at' => 'immutable_datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
