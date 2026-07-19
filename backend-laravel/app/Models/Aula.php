<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class Aula extends Model
{
    protected $table = 'aulas';

    protected $fillable = [
        'id_institucion',
        'nombre',
        'nivel',
        'codigo',
        'sourced_id',
        'id_curso',
        'id_periodo_academico',
        'tipo_clase',
        'estado_interoperabilidad',
    ];

    protected static function booted(): void
    {
        static::creating(function (Aula $aula): void {
            if (Schema::hasColumn('aulas', 'sourced_id')) {
                $aula->sourced_id ??= (string) Str::uuid();
            }
        });
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'id_aula');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso');
    }

    public function periodoAcademico(): BelongsTo
    {
        return $this->belongsTo(PeriodoAcademico::class, 'id_periodo_academico');
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(MatriculaAula::class, 'id_aula');
    }
}
