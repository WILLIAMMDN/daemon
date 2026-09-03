<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgresoExperiencia extends ModeloBase
{
    protected $table = 'progresos_experiencia';

    public $timestamps = true;

    protected $fillable = [
        'id_matricula', 'id_alumno', 'id_experiencia', 'id_intento_completado',
        'estado', 'porcentaje', 'iniciado_at', 'completado_at',
    ];

    protected function casts(): array
    {
        return ['porcentaje' => 'integer', 'iniciado_at' => 'datetime', 'completado_at' => 'datetime'];
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(MatriculaAula::class, 'id_matricula');
    }

    public function experiencia(): BelongsTo
    {
        return $this->belongsTo(ExperienciaAprendizaje::class, 'id_experiencia');
    }

    public function intentoCompletado(): BelongsTo
    {
        return $this->belongsTo(IntentoAprendizaje::class, 'id_intento_completado');
    }
}
