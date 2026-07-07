<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Institucion\InstitucionStoreRequest;
use App\Http\Requests\Api\V1\Institucion\InstitucionUpdateRequest;
use App\Models\Institucion;
use App\Services\Institucion\InstitucionService;
use Illuminate\Http\Request;

class InstitucionController extends Controller
{
    public function __construct(private readonly InstitucionService $instituciones) {}

    public function index(Request $request)
    {
        return $this->instituciones->listar($request);
    }

    public function show(Institucion $institucion)
    {
        return $this->instituciones->detalle($institucion);
    }

    public function store(InstitucionStoreRequest $request)
    {
        return response()->json($this->instituciones->crear($request->validated()), 201);
    }

    public function update(InstitucionUpdateRequest $request, Institucion $institucion)
    {
        return $this->instituciones->actualizar($institucion, $request->validated());
    }

    public function destroy(Institucion $institucion)
    {
        $this->instituciones->eliminar($institucion);

        return response()->noContent();
    }
}