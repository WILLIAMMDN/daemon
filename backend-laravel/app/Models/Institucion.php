<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class Institucion extends Model
{
    protected $table = 'instituciones';

    protected $fillable = [
        'nombre',
        'slug',
        'sourced_id',
        'estado_interoperabilidad',
    ];

    protected static function booted(): void
    {
        static::creating(function (Institucion $institucion): void {
            if (Schema::hasColumn('instituciones', 'sourced_id')) {
                $institucion->sourced_id ??= (string) Str::uuid();
            }
        });
    }

    public function aulas(): HasMany
    {
        return $this->hasMany(Aula::class, 'id_institucion');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'id_institucion');
    }

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class, 'id_institucion');
    }

    public function periodosAcademicos(): HasMany
    {
        return $this->hasMany(PeriodoAcademico::class, 'id_institucion');
    }
}
