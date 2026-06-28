<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;

class RankingController extends Controller
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function index()
    {
        return Usuario::where('rol', 'alumno')
            ->select('id', 'nombre_completo', 'usuario', 'nivel', 'tokens', 'rango', 'avatar')
            ->orderByDesc('tokens')
            ->orderBy('nombre_completo')
            ->get()
            ->map(fn (Usuario $usuario) => [
                ...$usuario->toArray(),
                'avatar' => $this->archivos->url($usuario->avatar),
            ])
            ->values();
    }
}
