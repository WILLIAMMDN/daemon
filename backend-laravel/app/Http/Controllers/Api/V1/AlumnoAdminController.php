<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Alumno\AdminAlumnoStoreRequest;
use App\Http\Requests\Api\V1\Alumno\AdminAlumnoUpdateRequest;
use App\Models\Usuario;
use App\Services\Alumno\AlumnoAdminService;

class AlumnoAdminController extends Controller
{
    public function __construct(private readonly AlumnoAdminService $alumnosAdmin) {}

    public function index(\Illuminate\Http\Request $request)
    {
        return $this->alumnosAdmin->listar($request);
    }

    public function estadisticas()
    {
        return $this->alumnosAdmin->estadisticas();
    }

    public function show(Usuario $usuario)
    {
        return $this->alumnosAdmin->detalle($usuario);
    }

    public function store(AdminAlumnoStoreRequest $request)
    {
        return response()->json($this->alumnosAdmin->crear($request->validated()), 201);
    }

    public function update(AdminAlumnoUpdateRequest $request, Usuario $usuario)
    {
        return $this->alumnosAdmin->actualizar($usuario, $request->validated());
    }

    public function destroy(Usuario $usuario)
    {
        $this->alumnosAdmin->eliminar($usuario);

        return response()->noContent();
    }

    public function resetearClave(Usuario $usuario)
    {
        return $this->alumnosAdmin->resetearClave($usuario);
    }
}