<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ObjetivoAprendizaje extends ModeloBase
{
    protected $table = 'objetivos_aprendizaje';

    public $timestamps = true;

    protected $fillable = ['id_institucion', 'uuid', 'codigo', 'descripcion', 'marco', 'nivel'];

    public function lecciones(): BelongsToMany
    {
        return $this->belongsToMany(Leccion::class, 'leccion_objetivo', 'id_objetivo', 'id_leccion');
    }
}
