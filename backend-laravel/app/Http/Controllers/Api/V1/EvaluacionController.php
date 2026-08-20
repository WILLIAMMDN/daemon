<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Evaluacion\EvaluacionStoreRequest;
use App\Http\Requests\Api\V1\Evaluacion\EvaluacionUpdateRequest;
use App\Http\Requests\Api\V1\Evaluacion\GuardarPreguntasRequest;
use App\Http\Requests\Api\V1\Evaluacion\ResponderEvaluacionRequest;
use App\Models\Evaluacion;
use App\Services\Evaluacion\EvaluacionService;
use Illuminate\Http\Request;

class EvaluacionController extends Controller
{
    public function __construct(private readonly EvaluacionService $evaluaciones) {}

    public function index(Request $request)
    {
        return $this->evaluaciones->listadoDocente($request->user());
    }

    public function activas(Request $request)
    {
        return $this->evaluaciones->activasParaNivel($request->user());
    }

    public function store(EvaluacionStoreRequest $request)
    {
        return response()->json($this->evaluaciones->crear($request->user(), $request->validated()), 201);
    }

    public function update(EvaluacionUpdateRequest $request, Evaluacion $evaluacion)
    {
        return $this->evaluaciones->actualizar($request->user(), $evaluacion, $request->validated());
    }

    public function destroy(Request $request, Evaluacion $evaluacion)
    {
        $this->evaluaciones->eliminar($request->user(), $evaluacion);

        return response()->noContent();
    }

    public function publicar(Request $request, Evaluacion $evaluacion)
    {
        return $this->evaluaciones->publicar($request->user(), $evaluacion);
    }

    public function despublicar(Request $request, Evaluacion $evaluacion)
    {
        return $this->evaluaciones->despublicar($request->user(), $evaluacion);
    }

    public function guardarPreguntas(GuardarPreguntasRequest $request, Evaluacion $evaluacion)
    {
        $this->evaluaciones->guardarPreguntas($request->user(), $evaluacion, $request->validated()['preguntas']);

        return ['ok' => true];
    }

    public function responder(ResponderEvaluacionRequest $request, Evaluacion $evaluacion)
    {
        return $this->evaluaciones->responder($request->user(), $evaluacion, $request->validated()['respuestas']);
    }

    public function resultados(Request $request)
    {
        return $this->evaluaciones->resultados($request->user());
    }
}
