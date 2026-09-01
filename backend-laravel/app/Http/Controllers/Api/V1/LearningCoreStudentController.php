<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academico\EvaluarIntentoRequest;
use App\Http\Requests\Api\V1\Alumno\EvidenciaAprendizajeRequest;
use App\Http\Requests\Api\V1\Alumno\IniciarIntentoRequest;
use App\Models\ExperienciaAprendizaje;
use App\Models\IntentoAprendizaje;
use App\Models\RutaAprendizaje;
use App\Services\Academico\LearningProgressionService;
use Illuminate\Http\Request;

class LearningCoreStudentController extends Controller
{
    public function __construct(private readonly LearningProgressionService $progresion) {}

    public function mapa(Request $request): array
    {
        return $this->progresion->mapa($request->user());
    }

    public function siguiente(Request $request): array
    {
        return ['nextItem' => $this->progresion->siguiente($request->user())];
    }

    public function rutas(Request $request): array
    {
        return ['paths' => $this->progresion->rutasDisponibles($request->user())];
    }

    public function ruta(Request $request, RutaAprendizaje $ruta): array
    {
        return $this->progresion->detalleRuta($request->user(), $ruta);
    }

    public function iniciarIntento(IniciarIntentoRequest $request, ExperienciaAprendizaje $experiencia)
    {
        return response()->json(
            $this->progresion->iniciarIntento($request->user(), $experiencia, $request->validated('idempotency_key')),
            201,
        );
    }

    public function evidencia(EvidenciaAprendizajeRequest $request, IntentoAprendizaje $intento)
    {
        return $this->progresion->entregarEvidencia($request->user(), $intento, $request->validated());
    }

    public function evaluar(EvaluarIntentoRequest $request, IntentoAprendizaje $intento)
    {
        return $this->progresion->evaluarIntento($request->user(), $intento, $request->validated());
    }
}
