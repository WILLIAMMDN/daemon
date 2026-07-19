<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DominioObjetivo extends ModeloBase
{
    protected $table = 'dominios_objetivo';

    public $timestamps = true;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'porcentaje' => 'decimal:2',
            'cantidad_evidencias' => 'integer',
            'ultima_evidencia_at' => 'datetime',
            'calculado_at' => 'datetime',
        ];
    }

    public function objetivo(): BelongsTo
    {
        return $this->belongsTo(ObjetivoAprendizaje::class, 'id_objetivo');
    }

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_alumno');
    }
}
