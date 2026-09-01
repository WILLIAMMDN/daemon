<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvidenciaAprendizaje extends ModeloBase
{
    protected $table = 'evidencias_aprendizaje';

    public $timestamps = true;

    protected $fillable = ['uuid', 'id_intento', 'id_objetivo', 'tipo', 'referencia', 'metadatos', 'registrado_at'];

    protected function casts(): array
    {
        return ['metadatos' => 'array', 'registrado_at' => 'datetime'];
    }

    public function intento(): BelongsTo
    {
        return $this->belongsTo(IntentoAprendizaje::class, 'id_intento');
    }

    public function objetivo(): BelongsTo
    {
        return $this->belongsTo(ObjetivoAprendizaje::class, 'id_objetivo');
    }
}
