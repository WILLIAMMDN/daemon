<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HitoAprendizaje extends ModeloBase
{
    protected $table = 'hitos_aprendizaje';

    public $timestamps = true;

    protected $fillable = ['uuid', 'id_ruta', 'titulo', 'descripcion', 'orden', 'obligatorio', 'requisitos_completitud'];

    protected function casts(): array
    {
        return ['orden' => 'integer', 'obligatorio' => 'boolean', 'requisitos_completitud' => 'array'];
    }

    protected static function booted(): void
    {
        $exigirBorrador = function (HitoAprendizaje $hito): void {
            $hito->loadMissing('ruta');
            abort_if($hito->ruta && $hito->ruta->estado !== 'draft', 409, 'No se puede mutar un hito de una ruta publicada.');
        };
        static::creating($exigirBorrador);
        static::updating($exigirBorrador);
        static::deleting($exigirBorrador);
    }

    public function ruta(): BelongsTo
    {
        return $this->belongsTo(RutaAprendizaje::class, 'id_ruta');
    }

    public function experiencias(): HasMany
    {
        return $this->hasMany(ExperienciaAprendizaje::class, 'id_hito')->orderBy('orden');
    }

    public function prerrequisitos(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'hito_prerrequisitos',
            'id_hito',
            'id_prerrequisito',
        );
    }
}
