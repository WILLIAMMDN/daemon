<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MascotaRareza;
use App\Enums\MascotaSlot;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Mascota\EspecieMascotaStoreRequest;
use App\Http\Requests\Api\V1\Mascota\EspecieMascotaUpdateRequest;
use App\Models\CosmeticoMascota;
use App\Models\EspecieMascota;

class MascotaCatalogoController extends Controller
{
    public function index(): array
    {
        return [
            'especies' => EspecieMascota::withCount(['cosmeticos', 'mascotas'])->orderBy('orden')->get(),
            'cosmeticos' => CosmeticoMascota::with(['premio:id,nombre,precio,stock', 'especies:id,nombre'])->orderByDesc('id')->get(),
            'slots' => collect(MascotaSlot::cases())->map(fn (MascotaSlot $slot) => [
                'codigo' => $slot->value,
                'etiqueta' => $slot->etiqueta(),
                'orden_sugerido' => $slot->ordenSugerido(),
            ]),
            'rarezas' => MascotaRareza::values(),
            'contrato_assets' => [
                'formato' => 'PNG o WebP transparente',
                'coordenadas' => 'Cada capa usa el lienzo completo de su especie y el mismo origen (0,0).',
                'ruta_sugerida' => 'img/mascotas/{especie}/{slot}/{codigo}.webp',
            ],
        ];
    }

    public function store(EspecieMascotaStoreRequest $request)
    {
        return response()->json(EspecieMascota::create($request->validated()), 201);
    }

    public function update(EspecieMascotaUpdateRequest $request, EspecieMascota $especie): EspecieMascota
    {
        $especie->update($request->validated());

        return $especie->fresh();
    }
}
