<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Chatbot\AdminUpdateBotRequest;
use App\Http\Requests\Api\V1\Chatbot\EnviarMensajeRequest;
use App\Http\Requests\Api\V1\Chatbot\GuardarBotRequest;
use App\Http\Requests\Api\V1\Chatbot\GuardarCerebroRequest;
use App\Models\BotAlumno;
use App\Services\Archivo\ArchivoService;
use App\Services\Chatbot\ChatbotService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use RuntimeException;

class ChatbotController extends Controller
{
    public function __construct(
        private readonly ChatbotService $chatbot,
        private readonly ArchivoService $archivos,
    ) {}

    public function bot(Request $request)
    {
        return $this->chatbot->bot($request->user());
    }

    public function guardarBot(GuardarBotRequest $request)
    {
        $datos = $request->validated();
        if ($request->hasFile('avatar')) {
            $datos['avatar'] = $this->archivos->guardarRuta($request->user(), $request->file('avatar'), $this->archivos->directorioBot($request->user()));
        }

        return $this->chatbot->guardarBot($request->user(), $datos);
    }

    public function mensajes(Request $request)
    {
        return $this->chatbot->mensajes($request->user());
    }

    public function modelos()
    {
        return $this->chatbot->obtenerModelos();
    }

    public function chat(EnviarMensajeRequest $request)
    {
        try {
            $mensaje = $this->chatbot->responder($request->user(), $request->validated()['content']);
        } catch (ConnectionException|RequestException|RuntimeException $e) {
            report($e);
            $errorMsg = $e->getMessage();
            if ($e instanceof RequestException && $e->response) {
                $errorMsg = $e->response->json('error.message') ?? $errorMsg;
            }
            if (empty($errorMsg) || str_contains($errorMsg, 'cURL error')) {
                $errorMsg = 'No se pudo conectar con la Inteligencia Artificial.';
            }

            return response()->json(['message' => 'Error de IA: ' . $errorMsg], 503);
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

    public function adminIndex(Request $request)
    {
        return $this->chatbot->adminListar($request);
    }

    public function adminShow(Request $request, BotAlumno $bot)
    {
        return $this->chatbot->adminDetalle($request->user(), $bot);
    }

    public function adminUpdate(AdminUpdateBotRequest $request, BotAlumno $bot)
    {
        return $this->chatbot->adminActualizar($request->user(), $bot, $request->validated());
    }

    public function adminDestroy(Request $request, BotAlumno $bot)
    {
        $this->chatbot->adminEliminar($request->user(), $bot);

        return response()->noContent();
    }

    public function adminLimpiarChat(Request $request, BotAlumno $bot)
    {
        $eliminados = $this->chatbot->adminLimpiarChat($request->user(), $bot);

        return ['ok' => true, 'eliminados' => $eliminados];
    }
}
