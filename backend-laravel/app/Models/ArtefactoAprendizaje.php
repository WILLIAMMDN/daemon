<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtefactoAprendizaje extends ModeloBase
{
    protected $table = 'artefactos_aprendizaje';

    public $timestamps = true;

    protected $fillable = [
        'uuid',
        'id_intento',
        'id_evidencia',
        'id_usuario',
        'categoria',
        'nombre_original',
        'storage_path',
        'disk',
        'mime_type',
        'tamanio_bytes',
        'checksum_sha256',
        'url_externa',
        'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'tamanio_bytes' => 'integer',
            'metadatos' => 'array',
        ];
    }

    public function intento(): BelongsTo
    {
        return $this->belongsTo(IntentoAprendizaje::class, 'id_intento');
    }

    public function evidencia(): BelongsTo
    {
        return $this->belongsTo(EvidenciaAprendizaje::class, 'id_evidencia');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }
}
