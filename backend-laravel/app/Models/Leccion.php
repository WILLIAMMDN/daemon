<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Leccion extends ModeloBase
{
    protected $table = 'lecciones';

    public $timestamps = true;

    protected $fillable = ['id_unidad', 'uuid', 'titulo', 'resumen', 'contenido', 'orden', 'duracion_minutos', 'estado'];

    protected function casts(): array
    {
        return ['contenido' => 'array', 'orden' => 'integer', 'duracion_minutos' => 'integer'];
    }

    protected static function booted(): void
    {
        $exigirVersionEditable = function (Leccion $leccion): void {
            $leccion->loadMissing('unidad.versionCurso');
            abort_if($leccion->unidad?->versionCurso && $leccion->unidad->versionCurso->estado !== 'draft', 409, 'No se puede mutar una lección de una versión publicada.');
        };
        static::creating($exigirVersionEditable);
        static::updating($exigirVersionEditable);
        static::deleting($exigirVersionEditable);
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadCurso::class, 'id_unidad');
    }

    public function objetivos(): BelongsToMany
    {
        return $this->belongsToMany(ObjetivoAprendizaje::class, 'leccion_objetivo', 'id_leccion', 'id_objetivo');
    }

    public function progresos(): HasMany
    {
        return $this->hasMany(ProgresoLeccion::class, 'id_leccion');
    }
}
