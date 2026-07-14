<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Gamificacion\GamificacionService;

class RankingController extends Controller
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly GamificacionService $gamificacion,
    ) {}

    public function index()
    {
        return Usuario::where('rol', 'alumno')
            ->select('id', 'nombre_completo', 'usuario', 'nivel', 'experiencia', 'rango', 'avatar')
            ->orderByDesc('experiencia')
            ->orderBy('nombre_completo')
            ->get()
            ->map(function (Usuario $usuario) {
                $progreso = $this->gamificacion->progreso((int) $usuario->experiencia);

                return [
                    ...$usuario->toArray(),
                    'nivel_gamificacion' => $progreso['nivel'],
                    'progreso_nivel' => $progreso,
                    'avatar' => $this->archivos->url($usuario->avatar),
                ];
            })
            ->values();
    }
}
