<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EspecieMascota extends Model
{
    protected $table = 'mascota_especies';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'lienzo_ancho' => 'integer',
            'lienzo_alto' => 'integer',
            'orden' => 'integer',
        ];
    }

    public function cosmeticos(): BelongsToMany
    {
        return $this->belongsToMany(CosmeticoMascota::class, 'mascota_compatibilidades', 'id_especie', 'id_cosmetico');
    }

    public function mascotas(): HasMany
    {
        return $this->hasMany(MascotaAlumno::class, 'id_especie');
    }
}
