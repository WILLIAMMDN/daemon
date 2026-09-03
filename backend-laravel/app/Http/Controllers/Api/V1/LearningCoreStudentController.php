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

    public function revisiones(Request $request): array
    {
        return [
            'data' => $this->progresion->listarRevisiones($request->user(), $request->only(['estado', 'id_curso', 'id_aula'])),
        ];
    }

    public function detalleRevision(Request $request, IntentoAprendizaje $intento): array
    {
        return [
            'data' => $this->progresion->detalleRevision($request->user(), $intento),
        ];
    }

    public function subirArtefacto(Request $request, IntentoAprendizaje $intento, \App\Services\Academico\ArtefactoAprendizajeService $artefactos)
    {
        if ($request->hasFile('archivo')) {
            $request->validate([
                'archivo' => ['required', 'file', 'max:10240'],
            ]);
            $artefacto = $artefactos->subirArchivo($request->user(), $intento, $request->file('archivo'));
        } elseif ($request->filled('url_externa')) {
            $request->validate([
                'url_externa' => ['required', 'url', 'max:1000'],
                'nombre' => ['nullable', 'string', 'max:255'],
            ]);
            $artefacto = $artefactos->adjuntarEnlaceExterno($request->user(), $intento, (string) $request->input('url_externa'), $request->input('nombre'));
        } else {
            abort(422, 'Se requiere un archivo o una url_externa para adjuntar el artefacto.');
        }

        return response()->json($artefactos->serializarArtefacto($artefacto), 201);
    }

    public function eliminarArtefacto(Request $request, IntentoAprendizaje $intento, \App\Models\ArtefactoAprendizaje $artefacto, \App\Services\Academico\ArtefactoAprendizajeService $artefactos)
    {
        $artefactos->eliminarBorrador($request->user(), $intento, $artefacto);

        return response()->json(['ok' => true]);
    }

    public function descargarArtefacto(Request $request, \App\Models\ArtefactoAprendizaje $artefacto, \App\Services\Academico\ArtefactoAprendizajeService $artefactos)
    {
        return $artefactos->descargarContenido($request->user(), $artefacto);
    }
}
