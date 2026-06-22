<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;

class RankingController extends Controller
{
    public function index()
    {
        return Usuario::where('rol', 'alumno')
            ->select('id', 'nombre_completo', 'usuario', 'nivel', 'tokens', 'rango', 'avatar')
            ->orderByDesc('tokens')
            ->orderBy('nombre_completo')
            ->get()
            ->values();
    }
}
