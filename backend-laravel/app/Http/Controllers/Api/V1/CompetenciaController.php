<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Competencia\ControlCompetenciaRequest;
use App\Http\Requests\Api\V1\Competencia\EnviarChatLiveRequest;
use App\Http\Requests\Api\V1\Competencia\VotarRequest;
use App\Services\Competencia\CompetenciaService;
use Illuminate\Http\Request;

class CompetenciaController extends Controller
{
    public function __construct(private readonly CompetenciaService $competencia) {}

    public function estado(Request $request)
    {
        return $this->competencia->estado($request->user());
    }

    public function chat(Request $request)
    {
        return $this->competencia->chat($request->user());
    }

    public function enviarChat(EnviarChatLiveRequest $request)
    {
        return response()->json($this->competencia->enviarChat($request->user(), $request->validated()['mensaje']), 201);
    }

    public function votar(VotarRequest $request)
    {
        $this->competencia->votar($request->user(), $request->validated());

        return ['ok' => true];
    }

    public function control(ControlCompetenciaRequest $request)
    {
        return $this->competencia->controlar($request->user(), $request->validated());
    }

    public function historial()
    {
        return $this->competencia->historial();
    }
}
