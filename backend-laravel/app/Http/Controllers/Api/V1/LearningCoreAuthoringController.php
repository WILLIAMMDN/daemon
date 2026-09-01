<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academico\ExperienciaAprendizajeRequest;
use App\Http\Requests\Api\V1\Academico\HitoAprendizajeRequest;
use App\Http\Requests\Api\V1\Academico\RutaAprendizajeRequest;
use App\Http\Requests\Api\V1\Academico\UnidadRequest;
use App\Http\Requests\Api\V1\Academico\VersionCursoRequest;
use App\Models\Aula;
use App\Models\Curso;
use App\Models\HitoAprendizaje;
use App\Models\RutaAprendizaje;
use App\Models\VersionCurso;
use App\Services\Academico\LearningCoreAuthoringService;
use Illuminate\Http\Request;

class LearningCoreAuthoringController extends Controller
{
    public function __construct(private readonly LearningCoreAuthoringService $autoria) {}

    public function crearVersion(VersionCursoRequest $request, Curso $curso)
    {
        return response()->json($this->autoria->crearVersion($request->user(), $curso, $request->validated()), 201);
    }

    public function actualizarVersion(VersionCursoRequest $request, VersionCurso $version)
    {
        return $this->autoria->actualizarVersion($request->user(), $version, $request->validated());
    }

    public function crearUnidad(UnidadRequest $request, VersionCurso $version)
    {
        return response()->json($this->autoria->crearUnidad($request->user(), $version, $request->validated()), 201);
    }

    public function publicarVersion(Request $request, VersionCurso $version)
    {
        return $this->autoria->publicarVersion($request->user(), $version);
    }

    public function archivarVersion(Request $request, VersionCurso $version)
    {
        return $this->autoria->archivarVersion($request->user(), $version);
    }

    public function vincularAula(Request $request, Aula $aula)
    {
        $datos = $request->validate(['id_version_curso' => ['required', 'integer', 'exists:versiones_curso,id']]);

        return $this->autoria->vincularVersionAula($request->user(), $aula, VersionCurso::findOrFail($datos['id_version_curso']));
    }

    public function crearRuta(RutaAprendizajeRequest $request, VersionCurso $version)
    {
        return response()->json($this->autoria->crearRuta($request->user(), $version, $request->validated()), 201);
    }

    public function actualizarRuta(RutaAprendizajeRequest $request, RutaAprendizaje $ruta)
    {
        return $this->autoria->actualizarRuta($request->user(), $ruta, $request->validated());
    }

    public function crearHito(HitoAprendizajeRequest $request, RutaAprendizaje $ruta)
    {
        return response()->json($this->autoria->crearHito($request->user(), $ruta, $request->validated()), 201);
    }

    public function prerrequisitos(Request $request, HitoAprendizaje $hito)
    {
        $datos = $request->validate([
            'prerrequisitos' => ['present', 'array', 'max:100'],
            'prerrequisitos.*' => ['integer', 'exists:hitos_aprendizaje,id'],
        ]);

        return $this->autoria->configurarPrerrequisitos($request->user(), $hito, $datos['prerrequisitos']);
    }

    public function crearExperiencia(ExperienciaAprendizajeRequest $request, HitoAprendizaje $hito)
    {
        return response()->json($this->autoria->crearExperiencia($request->user(), $hito, $request->validated()), 201);
    }

    public function publicarRuta(Request $request, RutaAprendizaje $ruta)
    {
        return $this->autoria->publicarRuta($request->user(), $ruta);
    }

    public function archivarRuta(Request $request, RutaAprendizaje $ruta)
    {
        return $this->autoria->archivarRuta($request->user(), $ruta);
    }
}
