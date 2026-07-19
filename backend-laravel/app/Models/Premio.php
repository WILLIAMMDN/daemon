<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;

class Premio extends ModeloBase
{
    protected $table = 'premios';

    protected $hidden = ['datos_secretos'];

    protected function casts(): array
    {
        return [
            'datos_secretos' => 'encrypted',
        ];
    }

    public function cosmetico(): HasOne
    {
        return $this->hasOne(CosmeticoMascota::class, 'id_premio');
    }
}
