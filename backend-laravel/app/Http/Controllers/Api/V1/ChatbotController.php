<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Chatbot\EnviarMensajeRequest;
use App\Http\Requests\Api\V1\Chatbot\GuardarBotRequest;
use App\Http\Requests\Api\V1\Chatbot\GuardarCerebroRequest;
use App\Services\Chatbot\ChatbotService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use RuntimeException;

class ChatbotController extends Controller
{
    public function __construct(private readonly ChatbotService $chatbot) {}

    public function bot(Request $request)
    {
        return $this->chatbot->bot($request->user());
    }

    public function guardarBot(GuardarBotRequest $request)
    {
        $datos = $request->validated();
        if ($request->hasFile('avatar')) {
            $datos['avatar'] = $request->file('avatar')->store("bots/{$request->user()->id}", 'public');
        }

        return $this->chatbot->guardarBot($request->user(), $datos);
    }

    public function mensajes(Request $request)
    {
        return $this->chatbot->mensajes($request->user());
    }

    public function chat(EnviarMensajeRequest $request)
    {
        try {
            $mensaje = $this->chatbot->responder($request->user(), $request->validated()['content']);
        } catch (ConnectionException|RequestException|RuntimeException $e) {
            report($e);

            return response()->json(['message' => 'Ollama no esta disponible. Inicia Ollama y descarga el modelo configurado.'], 503);
        }

        return response()->json($mensaje, 201);
    }

    public function limpiar(Request $request)
    {
        $this->chatbot->limpiar($request->user());

        return response()->noContent();
    }

    public function cargarCerebro(Request $request)
    {
        return ['matriz_neural' => $this->chatbot->cerebro($request->user())];
    }

    public function guardarCerebro(GuardarCerebroRequest $request)
    {
        return $this->chatbot->guardarCerebro($request->user(), $request->validated()['matriz_neural']);
    }
}
