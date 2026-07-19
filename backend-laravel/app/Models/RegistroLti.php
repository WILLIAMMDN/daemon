<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class RegistroLti extends ModeloBase
{
    protected $table = 'registros_lti';

    public $timestamps = true;

    protected $fillable = [
        'id_institucion', 'uuid', 'nombre', 'rol_daemon', 'issuer', 'client_id', 'deployment_id',
        'auth_login_url', 'auth_token_url', 'keyset_url', 'redirect_uris', 'servicios', 'activo', 'verificado_at',
    ];

    protected function casts(): array
    {
        return ['redirect_uris' => 'array', 'servicios' => 'array', 'activo' => 'boolean', 'verificado_at' => 'datetime'];
    }

    public function vinculos(): HasMany
    {
        return $this->hasMany(VinculoLti::class, 'id_registro_lti');
    }
}
