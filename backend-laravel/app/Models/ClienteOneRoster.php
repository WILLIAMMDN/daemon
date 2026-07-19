<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClienteOneRoster extends ModeloBase
{
    protected $table = 'clientes_oneroster';

    public $timestamps = true;

    protected $fillable = ['id_institucion', 'nombre', 'client_id', 'secret_hash', 'scopes', 'activo', 'ultimo_uso_at'];

    protected $hidden = ['secret_hash'];

    protected function casts(): array
    {
        return ['scopes' => 'array', 'activo' => 'boolean', 'ultimo_uso_at' => 'datetime'];
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(TokenOneRoster::class, 'id_cliente');
    }
}
