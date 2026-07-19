<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VinculoLti extends ModeloBase
{
    protected $table = 'vinculos_lti';

    public $timestamps = true;

    protected $fillable = ['id_registro_lti', 'id_usuario', 'subject', 'activo', 'ultimo_acceso_at'];

    protected function casts(): array
    {
        return ['activo' => 'boolean', 'ultimo_acceso_at' => 'datetime'];
    }

    public function registro(): BelongsTo
    {
        return $this->belongsTo(RegistroLti::class, 'id_registro_lti');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }
}
