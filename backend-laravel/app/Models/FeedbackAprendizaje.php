<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackAprendizaje extends ModeloBase
{
    protected $table = 'feedback_aprendizaje';

    public $timestamps = true;

    protected $fillable = ['uuid', 'id_intento', 'id_autor', 'comentario', 'criterios', 'registrado_at'];

    protected function casts(): array
    {
        return ['criterios' => 'array', 'registrado_at' => 'datetime'];
    }

    public function intento(): BelongsTo
    {
        return $this->belongsTo(IntentoAprendizaje::class, 'id_intento');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_autor');
    }
}
