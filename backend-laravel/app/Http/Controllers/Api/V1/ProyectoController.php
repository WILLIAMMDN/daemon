<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Proyecto\ProyectoService;
use Illuminate\Http\Request;

class ProyectoController extends Controller
{
    public function __construct(private readonly ProyectoService $proyectos) {}

    public function index(Request $request): array
    {
        return $this->proyectos->catalogo($request->user());
    }
}
