<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Archivo\ArchivoStoreRequest;
use App\Services\Archivo\ArchivoService;

class ArchivoController extends Controller
{
    public function __construct(private readonly ArchivoService $archivos) {}

    public function store(ArchivoStoreRequest $request)
    {
        $datos = $request->validated();

        return response()->json($this->archivos->guardar($request->user(), $datos['archivo'], $datos['carpeta'] ?? null), 201);
    }
}
