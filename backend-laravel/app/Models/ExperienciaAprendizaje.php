<?php

namespace App\Models;

use App\Enums\TipoExperienciaAprendizaje;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExperienciaAprendizaje extends ModeloBase
{
    protected $table = 'experiencias_aprendizaje';

    public $timestamps = true;

    protected $fillable = [
        'uuid', 'id_hito', 'id_unidad', 'tipo', 'variante', 'titulo', 'descripcion',
        'contenido', 'origen_tipo', 'origen_id', 'orden', 'obligatoria', 'permite_intentos',
        'max_intentos', 'regla_completitud', 'guia_entrega', 'estado',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoExperienciaAprendizaje::class,
            'orden' => 'integer',
            'obligatoria' => 'boolean',
            'permite_intentos' => 'boolean',
            'max_intentos' => 'integer',
            'contenido' => 'array',
            'regla_completitud' => 'array',
            'guia_entrega' => 'array',
        ];
    }

    protected static function booted(): void
    {
        $exigirBorrador = function (ExperienciaAprendizaje $experiencia): void {
            $experiencia->loadMissing('hito.ruta');
            abort_if($experiencia->hito?->ruta && $experiencia->hito->ruta->estado !== 'draft', 409, 'No se puede mutar una experiencia de una ruta publicada.');
        };
        static::creating($exigirBorrador);
        static::updating($exigirBorrador);
        static::deleting($exigirBorrador);
    }

    public function hito(): BelongsTo
    {
        return $this->belongsTo(HitoAprendizaje::class, 'id_hito');
    }

    public function unidad(): BelongsTo
    {
        return $this->belongsTo(UnidadCurso::class, 'id_unidad');
    }

    public function objetivos(): BelongsToMany
    {
        return $this->belongsToMany(ObjetivoAprendizaje::class, 'experiencia_objetivo', 'id_experiencia', 'id_objetivo');
    }

    public function progresos(): HasMany
    {
        return $this->hasMany(ProgresoExperiencia::class, 'id_experiencia');
    }

    public function intentos(): HasMany
    {
        return $this->hasMany(IntentoAprendizaje::class, 'id_experiencia');
    }
}
