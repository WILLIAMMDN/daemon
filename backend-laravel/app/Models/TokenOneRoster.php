<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenOneRoster extends ModeloBase
{
    protected $table = 'tokens_oneroster';

    const UPDATED_AT = null;

    protected $fillable = ['id_cliente', 'token_hash', 'scopes', 'expira_at', 'revocado_at'];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return ['scopes' => 'array', 'expira_at' => 'datetime', 'revocado_at' => 'datetime', 'created_at' => 'datetime'];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(ClienteOneRoster::class, 'id_cliente');
    }
}
