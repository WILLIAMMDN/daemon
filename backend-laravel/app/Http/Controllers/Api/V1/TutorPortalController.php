<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Tutor\AceptarVinculoTutorRequest;
use App\Http\Requests\Api\V1\Tutor\ActualizarLimitePantallaRequest;
use App\Models\ConsentimientoPrivacidad;
use App\Models\Usuario;
use App\Services\Familias\TutorPortalService;
use Illuminate\Http\Request;

class TutorPortalController extends Controller
{
    public function __construct(private readonly TutorPortalService $familias) {}

    public function invitaciones(Request $request): array
    {
        return ['invitaciones' => $this->familias->invitaciones($request->user())];
    }

    public function aceptar(AceptarVinculoTutorRequest $request, ConsentimientoPrivacidad $consentimiento): array
    {
        $vinculo = $this->familias->aceptar(
            $request->user(),
            $consentimiento,
            $request->validated()['parentesco'],
        );

        return ['message' => 'Vinculo familiar verificado.', 'alumno_id' => $vinculo->alumno_id];
    }

    public function panel(Request $request): array
    {
        $alumnoId = $request->integer('alumno_id') ?: null;

        return $this->familias->panel($request->user(), $alumnoId);
    }

    public function actualizarLimite(ActualizarLimitePantallaRequest $request, Usuario $alumno): array
    {
        return ['bienestar_digital' => $this->familias->actualizarLimite($request->user(), $alumno, $request->validated())];
    }
}
