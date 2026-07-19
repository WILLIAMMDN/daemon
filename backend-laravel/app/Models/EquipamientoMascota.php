<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipamientoMascota extends Model
{
    protected $table = 'mascota_equipamientos';

    protected $guarded = ['id'];

    public function cosmetico(): BelongsTo
    {
        return $this->belongsTo(CosmeticoMascota::class, 'id_cosmetico');
    }
}
