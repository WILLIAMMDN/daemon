<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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
}
