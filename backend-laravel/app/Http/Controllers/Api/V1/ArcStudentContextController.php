<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Alumno\AgendaAlumnoRequest;
use App\Services\Academico\ArcStudentContextService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class ArcStudentContextController extends Controller
{
    public function __construct(private readonly ArcStudentContextService $contexto) {}

    public function home(Request $request): array
    {
        return $this->contexto->home($request->user());
    }

    public function learning(Request $request): array
    {
        return $this->contexto->learning($request->user());
    }

    public function agenda(AgendaAlumnoRequest $request): array
    {
        $datos = $request->validated();

        return $this->contexto->agenda(
            $request->user(),
            CarbonImmutable::parse($datos['start']),
            CarbonImmutable::parse($datos['end']),
        );
    }
}
