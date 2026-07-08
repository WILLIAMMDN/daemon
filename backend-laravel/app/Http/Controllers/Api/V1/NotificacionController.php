<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones del usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $notificaciones = Notificacion::where('usuario_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notificaciones);
    }

    /**
     * Marcar una notificación como leída.
     */
    public function marcarLeida(Request $request, Notificacion $notificacion): JsonResponse
    {
        if ($notificacion->usuario_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $notificacion->update(['leida' => true]);

        return response()->json(['message' => 'Notificación marcada como leída', 'notificacion' => $notificacion]);
    }

    /**
     * Marcar todas las notificaciones como leídas.
     */
    public function marcarTodasLeidas(Request $request): JsonResponse
    {
        Notificacion::where('usuario_id', $request->user()->id)
            ->where('leida', false)
            ->update(['leida' => true]);

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }
}
