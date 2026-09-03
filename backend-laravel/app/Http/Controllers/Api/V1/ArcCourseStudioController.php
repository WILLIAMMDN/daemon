<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academico\BorradorVersionRequest;
use App\Models\Curso;
use App\Models\VersionCurso;
use App\Services\Academico\ArcCourseStudioService;
use Illuminate\Http\Request;

/**
 * API canónica de Course Operations / Studio.
 *
 * Es la única superficie de lectura y orquestación de autoría de cursos. Un
 * futuro adaptador MCP consume exactamente estos endpoints con un token de
 * actor académico: no hay lógica adicional en el cliente ni acceso directo a la
 * base de datos.
 */
class ArcCourseStudioController extends Controller
{
    public function __construct(private readonly ArcCourseStudioService $studio) {}

    public function catalogo(Request $request): array
    {
        return $this->studio->catalogo($request->user());
    }

    public function cursos(Request $request): array
    {
        return $this->studio->cursos($request->user());
    }

    public function curso(Request $request, Curso $curso): array
    {
        return $this->studio->curso($request->user(), $curso);
    }

    public function version(Request $request, VersionCurso $version): array
    {
        return $this->studio->version($request->user(), $version);
    }

    public function crearBorrador(BorradorVersionRequest $request, VersionCurso $version)
    {
        $borrador = $this->studio->crearBorradorDesde($request->user(), $version, $request->validated());

        return response()->json($this->studio->version($request->user(), $borrador), 201);
    }

    public function validar(Request $request, VersionCurso $version): array
    {
        return $this->studio->validar($request->user(), $version);
    }

    public function publicar(Request $request, VersionCurso $version): array
    {
        return $this->studio->publicar($request->user(), $version);
    }
}
