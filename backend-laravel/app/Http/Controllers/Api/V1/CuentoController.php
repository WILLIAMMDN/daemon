<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Cuento\AdminGuardarCuentoRequest;
use App\Http\Requests\Api\V1\Cuento\GuardarCuentoRequest;
use App\Models\Cuento;
use App\Services\Cuento\CuentoService;
use Illuminate\Http\Request;

class CuentoController extends Controller
{
    public function __construct(private readonly CuentoService $cuentos) {}

    public function index()
    {
        return $this->cuentos->galeria();
    }

    public function show(Cuento $cuento)
    {
        return $this->cuentos->detalle($cuento);
    }

    public function mio(Request $request)
    {
        return $this->cuentos->mio($request->user());
    }

    public function guardar(GuardarCuentoRequest $request)
    {
        return $this->cuentos->guardar($request->user(), $request->validated());
    }

    public function eliminarPropio(Request $request)
    {
        $eliminado = $this->cuentos->eliminarPropio($request->user());

        if (! $eliminado) {
            return response()->json(['message' => 'No tienes un cuento propio para eliminar.'], 404);
        }

        return response()->noContent();
    }

    public function adminIndex()
    {
        return $this->cuentos->adminListar();
    }

    public function adminUpdate(AdminGuardarCuentoRequest $request, Cuento $cuento)
    {
        return $this->cuentos->adminActualizar($cuento, $request->validated());
    }

    public function adminDestroy(Cuento $cuento)
    {
        $this->cuentos->adminEliminar($cuento);

        return response()->noContent();
    }

    public function adminPublicar(Request $request, Cuento $cuento)
    {
        $datos = $request->validate([
            'publicado' => ['required', 'boolean'],
        ]);

        return $this->cuentos->adminPublicar($cuento, (bool) $datos['publicado']);
    }
}
