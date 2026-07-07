<?php

namespace App\Models;

class Entrega extends ModeloBase
{
    protected $table = 'entregas';

    protected function casts(): array { return ['fecha_entrega' => 'datetime']; }

    public function mision() { return $this->belongsTo(Mision::class, 'id_desafio'); }
    public function alumno() { return $this->belongsTo(Usuario::class, 'id_alumno'); }
}
