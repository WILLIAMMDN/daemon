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

    public function index()
    {
        return $this->evaluaciones->listadoDocente();
    }

    public function activas(Request $request)
    {
        return $this->evaluaciones->activasParaNivel($request->user()->nivel);
    }

    public function store(EvaluacionStoreRequest $request)
    {
        return response()->json($this->evaluaciones->crear($request->validated()), 201);
    }

    public function update(EvaluacionUpdateRequest $request, Evaluacion $evaluacion)
    {
        return $this->evaluaciones->actualizar($evaluacion, $request->validated());
    }

    public function destroy(Evaluacion $evaluacion)
    {
        $this->evaluaciones->eliminar($evaluacion);

        return response()->noContent();
    }

    public function publicar(Evaluacion $evaluacion)
    {
        return $this->evaluaciones->publicar($evaluacion);
    }

    public function despublicar(Evaluacion $evaluacion)
    {
        return $this->evaluaciones->despublicar($evaluacion);
    }

    public function guardarPreguntas(GuardarPreguntasRequest $request, Evaluacion $evaluacion)
    {
        $this->evaluaciones->guardarPreguntas($evaluacion, $request->validated()['preguntas']);

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
