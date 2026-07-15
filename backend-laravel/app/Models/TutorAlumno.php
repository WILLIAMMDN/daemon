<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorAlumno extends ModeloBase
{
    protected $table = 'tutores_alumnos';

    public $timestamps = true;

    protected function casts(): array
    {
        return ['verificado_at' => 'immutable_datetime'];
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'tutor_id');
    }

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'alumno_id');
    }

    public function consentimiento(): BelongsTo
    {
        return $this->belongsTo(ConsentimientoPrivacidad::class, 'consentimiento_id');
    }
}
