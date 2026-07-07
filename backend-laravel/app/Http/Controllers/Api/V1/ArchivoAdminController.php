<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Archivo\ArchivoAdminService;
use Illuminate\Http\Request;

class ArchivoAdminController extends Controller
{
    public function __construct(private readonly ArchivoAdminService $archivosAdmin) {}

    public function index(Request $request)
    {
        return $this->archivosAdmin->listar($request);
    }

    public function prefijos()
    {
        return ['data' => $this->archivosAdmin->prefijosDisponibles()];
    }

    public function destroy(Request $request)
    {
        $datos = $request->validate([
            'ruta' => ['required', 'string', 'max:255'],
        ]);

        $eliminado = $this->archivosAdmin->eliminar($datos['ruta']);

        return ['ok' => true, 'eliminado' => $eliminado];
    }

    public function destroyBulk(Request $request)
    {
        $datos = $request->validate([
            'rutas' => ['required', 'array', 'min:1'],
            'rutas.*' => ['string', 'max:255'],
        ]);

        $eliminados = $this->archivosAdmin->eliminarBulk($datos['rutas']);

        return ['ok' => true, 'eliminados' => $eliminados];
    }
}