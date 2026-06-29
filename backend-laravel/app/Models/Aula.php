<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Aula extends Model
{
    protected $table = 'aulas';

    protected $fillable = [
        'id_institucion',
        'nombre',
        'nivel',
        'codigo',
    ];

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'id_aula');
    }
}
