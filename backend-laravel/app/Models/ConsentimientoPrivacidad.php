<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsentimientoPrivacidad extends Model
{
    protected $table = 'consentimientos_privacidad';

    protected $fillable = [
        'usuario_id',
        'audiencia',
        'version_politica',
        'estado',
        'email_tutor',
        'ip_hash',
        'user_agent_hash',
        'aceptado_at',
        'verificado_at',
        'revocado_at',
    ];

    protected $hidden = ['ip_hash', 'user_agent_hash'];

    protected function casts(): array
    {
        return [
            'email_tutor' => 'encrypted',
            'aceptado_at' => 'immutable_datetime',
            'verificado_at' => 'immutable_datetime',
            'revocado_at' => 'immutable_datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
