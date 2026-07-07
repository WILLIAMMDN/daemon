<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IaModelo\IaModeloStoreRequest;
use App\Http\Requests\Api\V1\IaModelo\IaModeloUpdateRequest;
use App\Models\ModeloIa;
use App\Services\IaModelo\IaModeloAdminService;
use Illuminate\Http\Request;

class IaModeloAdminController extends Controller
{
    public function __construct(private readonly IaModeloAdminService $admin) {}

    public function index(Request $request)
    {
        return $this->admin->listar($request);
    }

    public function estadisticas()
    {
        return $this->admin->estadisticas();
    }

    public function show(ModeloIa $modelo)
    {
        return $this->admin->detalle($modelo);
    }

    public function store(IaModeloStoreRequest $request)
    {
        return response()->json($this->admin->crear($request->validated()), 201);
    }

    public function update(IaModeloUpdateRequest $request, ModeloIa $modelo)
    {
        return $this->admin->actualizar($modelo, $request->validated());
    }

    public function destroy(ModeloIa $modelo)
    {
        $this->admin->eliminar($modelo);

        return response()->noContent();
    }

    public function destroyBulk(Request $request)
    {
        $datos = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'min:1'],
        ]);

        $eliminados = $this->admin->eliminarBulk($datos['ids']);

        return ['ok' => true, 'eliminados' => $eliminados];
    }
}