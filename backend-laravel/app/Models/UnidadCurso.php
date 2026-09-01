<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnidadCurso extends ModeloBase
{
    protected $table = 'unidades_curso';

    public $timestamps = true;

    protected $fillable = ['id_curso', 'id_version_curso', 'uuid', 'titulo', 'descripcion', 'orden', 'estado'];

    protected function casts(): array
    {
        return ['orden' => 'integer'];
    }

    protected static function booted(): void
    {
        $exigirVersionEditable = function (UnidadCurso $unidad): void {
            $unidad->loadMissing('versionCurso');
            abort_if($unidad->versionCurso && $unidad->versionCurso->estado !== 'draft', 409, 'No se puede mutar una unidad de una versión publicada.');
        };
        static::creating($exigirVersionEditable);
        static::updating($exigirVersionEditable);
        static::deleting($exigirVersionEditable);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function versionCurso(): BelongsTo
    {
        return $this->belongsTo(VersionCurso::class, 'id_version_curso');
    }

    public function lecciones(): HasMany
    {
        return $this->hasMany(Leccion::class, 'id_unidad')->orderBy('orden');
    }
}
