<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Gamificacion\GamificacionService;
use App\Services\Gamificacion\RankingService;
use Illuminate\Http\Request;

class RankingController extends Controller
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly GamificacionService $gamificacion,
        private readonly RankingService $ranking,
    ) {}

    public function index(Request $request): array
    {
        /** @var Usuario $actual */
        $actual = $request->user();
        $alcance = $this->ranking->alcanceDe($actual);
        $alumnos = $this->ranking->alumnosPara($actual)
            ->map(function (Usuario $usuario, int $indice) use ($actual): array {
                $progreso = $this->gamificacion->progreso((int) $usuario->experiencia);

                return [
                    'id' => $usuario->id,
                    'nombre_mostrado' => $this->ranking->nombreMostrado($usuario),
                    'nivel' => $usuario->nivel,
                    'experiencia' => (int) $usuario->experiencia,
                    'rango' => $usuario->rango,
                    'nivel_gamificacion' => $progreso['nivel'],
                    'progreso_nivel' => $progreso,
                    'avatar' => $this->archivos->url($usuario->avatar),
                    'posicion' => $indice + 1,
                    'es_actual' => (int) $usuario->id === (int) $actual->id,
                ];
            })
            ->values();

        return [
            'scope' => $alcance['codigo'],
            'scope_label' => $alcance['etiqueta'],
            'participantes' => $alumnos->count(),
            'alumnos' => $alumnos->all(),
        ];
    }
}
