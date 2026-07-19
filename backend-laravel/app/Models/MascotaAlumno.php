<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MascotaAlumno extends Model
{
    protected $table = 'mascotas_alumnos';

    protected $guarded = ['id'];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_alumno');
    }

    public function especie(): BelongsTo
    {
        return $this->belongsTo(EspecieMascota::class, 'id_especie');
    }

    public function equipamientos(): HasMany
    {
        return $this->hasMany(EquipamientoMascota::class, 'id_mascota');
    }
}
