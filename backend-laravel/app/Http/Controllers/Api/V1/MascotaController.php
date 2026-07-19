<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Mascota\MascotaEquiparRequest;
use App\Http\Requests\Api\V1\Mascota\MascotaUpdateRequest;
use App\Services\Mascota\MascotaService;
use Illuminate\Http\Request;

class MascotaController extends Controller
{
    public function __construct(private readonly MascotaService $mascotas) {}

    public function show(Request $request): array
    {
        return $this->mascotas->estado($request->user());
    }

    public function update(MascotaUpdateRequest $request): array
    {
        return $this->mascotas->actualizar($request->user(), $request->validated());
    }

    public function equipar(MascotaEquiparRequest $request): array
    {
        return $this->mascotas->equipar($request->user(), (int) $request->validated('id_cosmetico'));
    }

    public function quitar(Request $request, string $slot): array
    {
        return $this->mascotas->quitar($request->user(), $slot);
    }
}
