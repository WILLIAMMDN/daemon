<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Alumno\RegistrarUsoPantallaRequest;
use App\Services\Familias\BienestarDigitalService;
use Illuminate\Http\Request;

class BienestarDigitalController extends Controller
{
    public function __construct(private readonly BienestarDigitalService $bienestar) {}

    public function estado(Request $request): array
    {
        return ['bienestar_digital' => $this->bienestar->estadoPara($request->user())];
    }

    public function latido(RegistrarUsoPantallaRequest $request): array
    {
        return [
            'bienestar_digital' => $this->bienestar->registrarUso(
                $request->user(),
                $request->validated()['segundos'],
            ),
        ];
    }
}
