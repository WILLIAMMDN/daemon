<?php

namespace App\Models;

class Canje extends ModeloBase
{
    protected $table = 'canjes';

    protected function casts(): array { return ['fecha' => 'datetime', 'visto_por_alumno' => 'boolean']; }

    public function premio() { return $this->belongsTo(Premio::class, 'id_premio'); }
    public function alumno() { return $this->belongsTo(Usuario::class, 'id_alumno'); }
}
