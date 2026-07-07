<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Comunidad\MensajeStoreRequest;
use App\Models\ChatLive;
use App\Services\Comunidad\ComunidadService;
use Illuminate\Http\Request;

class ComunidadController extends Controller
{
    public function __construct(private readonly ComunidadService $comunidad) {}

    public function mensajes(Request $request)
    {
        return $this->comunidad->listarMensajes($request);
    }

    public function estadisticas(Request $request)
    {
        return $this->comunidad->estadisticas($request);
    }

    public function crearMensaje(MensajeStoreRequest $request)
    {
        return response()->json(
            $this->comunidad->crearMensaje($request->user(), $request->validated()),
            201
        );
    }

    public function eliminarMensaje(Request $request, ChatLive $mensaje)
    {
        $this->comunidad->eliminarMensaje($request->user(), $mensaje);

        return response()->noContent();
    }

    public function eliminarMensajesBulk(Request $request)
    {
        $datos = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'min:1'],
        ]);

        $eliminados = $this->comunidad->eliminarMensajesBulk($request->user(), $datos['ids']);

        return ['ok' => true, 'eliminados' => $eliminados];
    }
}