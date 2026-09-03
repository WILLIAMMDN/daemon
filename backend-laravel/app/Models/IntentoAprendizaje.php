<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntentoAprendizaje extends ModeloBase
{
    protected $table = 'intentos_aprendizaje';

    public $timestamps = true;

    protected $fillable = [
        'uuid', 'clave_idempotencia', 'id_matricula', 'id_alumno', 'id_experiencia', 'numero', 'estado',
        'puntaje', 'aprobado', 'iniciado_at', 'enviado_at', 'evaluado_at', 'metadatos',
    ];

    protected function casts(): array
    {
        return [
            'numero' => 'integer', 'puntaje' => 'decimal:2', 'aprobado' => 'boolean',
            'iniciado_at' => 'datetime', 'enviado_at' => 'datetime', 'evaluado_at' => 'datetime',
            'metadatos' => 'array',
        ];
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(MatriculaAula::class, 'id_matricula');
    }

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_alumno');
    }

    public function experiencia(): BelongsTo
    {
        return $this->belongsTo(ExperienciaAprendizaje::class, 'id_experiencia');
    }

    public function evidencias(): HasMany
    {
        return $this->hasMany(EvidenciaAprendizaje::class, 'id_intento');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(FeedbackAprendizaje::class, 'id_intento');
    }

    public function artefactos(): HasMany
    {
        return $this->hasMany(ArtefactoAprendizaje::class, 'id_intento');
    }
}
