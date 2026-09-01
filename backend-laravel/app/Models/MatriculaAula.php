<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatriculaAula extends ModeloBase
{
    protected $table = 'matriculas_aula';

    public $timestamps = true;

    protected $fillable = [
        'sourced_id', 'id_aula', 'id_version_curso', 'id_ruta_aprendizaje', 'id_usuario',
        'rol', 'es_principal', 'fecha_inicio', 'fecha_fin', 'estado',
    ];

    protected function casts(): array
    {
        return ['es_principal' => 'boolean', 'fecha_inicio' => 'date', 'fecha_fin' => 'date'];
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    public function versionCurso(): BelongsTo
    {
        return $this->belongsTo(VersionCurso::class, 'id_version_curso');
    }

    public function rutaAprendizaje(): BelongsTo
    {
        return $this->belongsTo(RutaAprendizaje::class, 'id_ruta_aprendizaje');
    }
}
