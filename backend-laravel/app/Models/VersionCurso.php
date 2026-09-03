<?php

namespace App\Models;

use App\Enums\AudienciaAprendizaje;
use App\Enums\EtapaAprendizaje;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VersionCurso extends ModeloBase
{
    protected $table = 'versiones_curso';

    public $timestamps = true;

    protected $fillable = [
        'uuid', 'id_curso', 'numero', 'titulo', 'descripcion', 'audiencia', 'etapa',
        'estado', 'publicado_at', 'archivado_at', 'id_autor', 'id_publicador', 'id_version_origen',
    ];

    protected function casts(): array
    {
        return [
            'numero' => 'integer',
            'audiencia' => AudienciaAprendizaje::class,
            'etapa' => EtapaAprendizaje::class,
            'publicado_at' => 'datetime',
            'archivado_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (VersionCurso $version): void {
            if (! in_array($version->getOriginal('estado'), ['published', 'archived'], true)) {
                return;
            }

            $permitidos = ['estado', 'archivado_at', 'updated_at'];
            abort_if(array_diff(array_keys($version->getDirty()), $permitidos) !== [], 409, 'Una versión publicada es inmutable.');
            abort_unless($version->getOriginal('estado') === 'published' && $version->estado === 'archived', 409, 'Una versión publicada solo puede archivarse.');
        });

        static::deleting(fn (VersionCurso $version) => abort_if(
            in_array($version->estado, ['published', 'archived'], true),
            409,
            'Una versión publicada no puede eliminarse.',
        ));
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_autor');
    }

    public function publicador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_publicador');
    }

    public function versionOrigen(): BelongsTo
    {
        return $this->belongsTo(self::class, 'id_version_origen');
    }

    public function unidades(): HasMany
    {
        return $this->hasMany(UnidadCurso::class, 'id_version_curso')->orderBy('orden');
    }

    public function aulas(): HasMany
    {
        return $this->hasMany(Aula::class, 'id_version_curso');
    }

    public function rutas(): HasMany
    {
        return $this->hasMany(RutaAprendizaje::class, 'id_version_curso');
    }
}
