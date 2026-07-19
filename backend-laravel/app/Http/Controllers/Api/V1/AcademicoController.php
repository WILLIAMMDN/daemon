<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academico\CursoRequest;
use App\Http\Requests\Api\V1\Academico\LeccionRequest;
use App\Http\Requests\Api\V1\Academico\PeriodoRequest;
use App\Http\Requests\Api\V1\Academico\ProgresoLeccionRequest;
use App\Http\Requests\Api\V1\Academico\UnidadRequest;
use App\Models\Aula;
use App\Models\Curso;
use App\Models\Leccion;
use App\Models\PeriodoAcademico;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Services\Academico\AprendizajeService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicoController extends Controller
{
    public function __construct(private readonly AprendizajeService $aprendizaje) {}

    public function catalogo(Request $request): array
    {
        return $this->aprendizaje->catalogo($request->user());
    }

    public function crearPeriodo(PeriodoRequest $request)
    {
        return response()->json($this->aprendizaje->crearPeriodo($request->user(), $request->validated()), 201);
    }

    public function crearCurso(CursoRequest $request)
    {
        return response()->json($this->aprendizaje->crearCurso($request->user(), $request->validated()), 201);
    }

    public function actualizarCurso(CursoRequest $request, Curso $curso)
    {
        return $this->aprendizaje->actualizarCurso($request->user(), $curso, $request->validated());
    }

    public function crearUnidad(UnidadRequest $request, Curso $curso)
    {
        return response()->json($this->aprendizaje->crearUnidad($request->user(), $curso, $request->validated()), 201);
    }

    public function actualizarUnidad(UnidadRequest $request, UnidadCurso $unidad)
    {
        return $this->aprendizaje->actualizarUnidad($request->user(), $unidad, $request->validated());
    }

    public function crearLeccion(LeccionRequest $request, UnidadCurso $unidad)
    {
        return response()->json($this->aprendizaje->crearLeccion($request->user(), $unidad, $request->validated()), 201);
    }

    public function actualizarLeccion(LeccionRequest $request, Leccion $leccion)
    {
        return $this->aprendizaje->actualizarLeccion($request->user(), $leccion, $request->validated());
    }

    public function crearObjetivo(Request $request)
    {
        $datos = $request->validate([
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id'],
            'codigo' => ['nullable', 'string', 'max:80'],
            'descripcion' => ['required', 'string', 'max:2000'],
            'marco' => ['nullable', 'string', 'max:100'],
            'nivel' => ['nullable', Rule::in(['KIDS', 'TEENS', 'TODOS'])],
        ]);

        return response()->json($this->aprendizaje->crearObjetivo($request->user(), $datos), 201);
    }

    public function matricular(Request $request, Aula $aula, Usuario $usuario)
    {
        $datos = $request->validate([
            'rol' => ['required', Rule::in(['student', 'teacher', 'administrator', 'guardian'])],
            'es_principal' => ['sometimes', 'boolean'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => ['sometimes', Rule::in(['active', 'tobedeleted'])],
        ]);

        return response()->json($this->aprendizaje->matricular($request->user(), $aula, $usuario, $datos), 201);
    }

    public function vincularAula(Request $request, Aula $aula)
    {
        $datos = $request->validate([
            'id_curso' => ['required', 'integer', 'exists:cursos,id'],
            'id_periodo_academico' => ['required', 'integer', 'exists:periodos_academicos,id'],
        ]);
        $curso = Curso::findOrFail($datos['id_curso']);
        $periodo = PeriodoAcademico::findOrFail($datos['id_periodo_academico']);

        return $this->aprendizaje->vincularAula($request->user(), $aula, $curso, $periodo);
    }

    public function alumno(Request $request): array
    {
        return $this->aprendizaje->aprendizajeAlumno($request->user());
    }

    public function progreso(ProgresoLeccionRequest $request, Leccion $leccion)
    {
        return response()->json($this->aprendizaje->registrarProgreso($request->user(), $leccion, $request->validated()));
    }
}
