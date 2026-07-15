<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Privacidad\ResolverSolicitudPrivacidadRequest;
use App\Http\Requests\Api\V1\Privacidad\SolicitudEliminacionRequest;
use App\Models\SolicitudPrivacidad;
use App\Services\Privacidad\PrivacidadService;
use Illuminate\Http\Request;

class PrivacidadController extends Controller
{
    public function __construct(private readonly PrivacidadService $privacidad) {}

    public function exportar(Request $request)
    {
        $nombre = 'daemon-datos-'.$request->user()->id.'-'.now()->format('Ymd-His').'.json';

        return response()
            ->json($this->privacidad->exportar($request->user()))
            ->header('Content-Disposition', 'attachment; filename="'.$nombre.'"')
            ->header('Cache-Control', 'private, no-store');
    }

    public function solicitarEliminacion(SolicitudEliminacionRequest $request)
    {
        $datos = $request->validated();
        $solicitud = $this->privacidad->solicitarEliminacion(
            $request->user(),
            $datos['confirmacion'],
            $datos['motivo'] ?? null,
        );

        return response()->json([
            'message' => 'La solicitud de eliminacion quedo registrada para revision segura.',
            'solicitud' => $solicitud,
        ], 202);
    }

    public function solicitudes()
    {
        return SolicitudPrivacidad::query()
            ->with('usuario:id,nombre_completo,email,usuario,nivel')
            ->latest('solicitado_at')
            ->paginate(50);
    }

    public function resolver(
        ResolverSolicitudPrivacidadRequest $request,
        SolicitudPrivacidad $solicitud,
    ) {
        return response()->json([
            'solicitud' => $this->privacidad->resolver($solicitud, $request->validated()),
        ]);
    }
}
