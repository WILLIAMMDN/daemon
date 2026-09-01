<?php

namespace App\Models;

use App\Enums\AudienciaAprendizaje;
use App\Enums\EtapaAprendizaje;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RutaAprendizaje extends ModeloBase
{
    protected $table = 'rutas_aprendizaje';

    public $timestamps = true;

    protected $fillable = [
        'uuid', 'id_institucion', 'id_curso', 'id_version_curso', 'titulo', 'descripcion',
        'audiencia', 'etapa', 'estado', 'publicado_at',
    ];

    protected function casts(): array
    {
        return [
            'audiencia' => AudienciaAprendizaje::class,
            'etapa' => EtapaAprendizaje::class,
            'publicado_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (RutaAprendizaje $ruta): void {
            if (! in_array($ruta->getOriginal('estado'), ['published', 'archived'], true)) {
                return;
            }

            $permitidos = ['estado', 'updated_at'];
            abort_if(array_diff(array_keys($ruta->getDirty()), $permitidos) !== [], 409, 'Una ruta publicada es inmutable.');
            abort_unless($ruta->getOriginal('estado') === 'published' && $ruta->estado === 'archived', 409, 'Una ruta publicada solo puede archivarse.');
        });
        static::deleting(fn (RutaAprendizaje $ruta) => abort_if(
            in_array($ruta->estado, ['published', 'archived'], true),
            409,
            'Una ruta publicada no puede eliminarse.',
        ));
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function versionCurso(): BelongsTo
    {
        return $this->belongsTo(VersionCurso::class, 'id_version_curso');
    }

    public function hitos(): HasMany
    {
        return $this->hasMany(HitoAprendizaje::class, 'id_ruta')->orderBy('orden');
    }
}
