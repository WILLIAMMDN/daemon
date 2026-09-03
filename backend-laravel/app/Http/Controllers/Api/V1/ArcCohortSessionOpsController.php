<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academico\SesionesCohorteRequest;
use App\Models\Aula;
use App\Services\Academico\ArcCohortSessionOpsService;
use Illuminate\Http\Request;

class ArcCohortSessionOpsController extends Controller
{
    public function __construct(private readonly ArcCohortSessionOpsService $operaciones) {}

    public function cohortes(Request $request): array
    {
        return $this->operaciones->cohortes($request->user());
    }

    public function sesiones(SesionesCohorteRequest $request, Aula $aula): array
    {
        return $this->operaciones->sesiones(
            $request->user(),
            $aula,
            $request->rangoInicio(),
            $request->rangoFin(),
        );
    }
}
