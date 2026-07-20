<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CuentoReaccion extends Model
{
    protected $table = 'cuento_reacciones';
    protected $fillable = ['cuento_id', 'usuario_id'];

    public function cuento()
    {
        return $this->belongsTo(Cuento::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
}
