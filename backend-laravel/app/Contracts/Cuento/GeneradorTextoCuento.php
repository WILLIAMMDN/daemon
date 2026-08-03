<?php

namespace App\Contracts\Cuento;

use App\Models\Usuario;

interface GeneradorTextoCuento
{
    /** @param list<array{role: string, content: string}> $mensajes */
    public function generar(Usuario $usuario, array $mensajes): string;
}
