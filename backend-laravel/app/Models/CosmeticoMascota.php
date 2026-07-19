<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CosmeticoMascota extends Model
{
    protected $table = 'mascota_cosmeticos';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'orden_capa' => 'integer',
        ];
    }

    public function premio(): BelongsTo
    {
        return $this->belongsTo(Premio::class, 'id_premio');
    }

    public function especies(): BelongsToMany
    {
        return $this->belongsToMany(EspecieMascota::class, 'mascota_compatibilidades', 'id_cosmetico', 'id_especie');
    }

    public function inventarios(): HasMany
    {
        return $this->hasMany(InventarioMascota::class, 'id_cosmetico');
    }
}
