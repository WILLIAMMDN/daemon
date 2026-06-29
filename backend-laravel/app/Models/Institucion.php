<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institucion extends Model
{
    protected $table = 'instituciones';

    protected $fillable = [
        'nombre',
        'slug',
    ];

    public function aulas(): HasMany
    {
        return $this->hasMany(Aula::class, 'id_institucion');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'id_institucion');
    }
}
