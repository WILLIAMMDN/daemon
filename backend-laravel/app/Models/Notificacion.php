<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends ModeloBase
{
    use HasFactory;

    protected $table = 'notificaciones';

    protected $fillable = [
        'usuario_id',
        'titulo',
        'mensaje',
        'url_accion',
        'leida',
    ];

    protected $casts = [
        'leida' => 'boolean',
    ];

    protected $dispatchesEvents = [
        'created' => \App\Events\NuevaNotificacion::class,
    ];

    /**
     * @return BelongsTo<Usuario, Notificacion>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
