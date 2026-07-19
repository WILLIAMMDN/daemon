<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Academico\LibroCalificacionesService;
use Illuminate\Http\Request;

class LibroCalificacionesController extends Controller
{
    public function __construct(private readonly LibroCalificacionesService $libro) {}

    public function index(Request $request): array
    {
        $datos = $request->validate(['id_aula' => ['nullable', 'integer', 'exists:aulas,id']]);

        return $this->libro->libro($request->user(), isset($datos['id_aula']) ? (int) $datos['id_aula'] : null);
    }

    public function dominio(Request $request): array
    {
        return $this->libro->dominioAlumno($request->user());
    }
}
