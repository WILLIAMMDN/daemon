<?php

namespace App\Http\Requests\Api\V1\Tienda;

use App\Enums\MascotaRareza;
use App\Enums\MascotaSlot;
use App\Enums\NivelAlumno;
use App\Models\Premio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PremioUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        /** @var Premio|null $premio */
        $premio = $this->route('premio');

        return [
            'nombre' => ['sometimes', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'categoria' => ['sometimes', Rule::in(NivelAlumno::conAlcanceGeneral('GENERAL'))],
            'tipo_entrega' => ['sometimes', 'in:fisico,digital,cosmetico'],
            'cosmetico' => ['required_if:tipo_entrega,cosmetico', 'array'],
            'cosmetico.codigo' => ['sometimes', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('mascota_cosmeticos', 'codigo')->ignore($premio?->cosmetico?->id)],
            'cosmetico.slot' => ['sometimes', Rule::enum(MascotaSlot::class)],
            'cosmetico.rareza' => ['sometimes', Rule::enum(MascotaRareza::class)],
            'cosmetico.asset_capa' => ['sometimes', 'string', 'max:255'],
            'cosmetico.asset_miniatura' => ['nullable', 'string', 'max:255'],
            'cosmetico.orden_capa' => ['sometimes', 'integer', 'min:-32768', 'max:32767'],
            'cosmetico.activo' => ['sometimes', 'boolean'],
            'cosmetico.especies' => ['sometimes', 'array', 'min:1'],
            'cosmetico.especies.*' => ['integer', Rule::exists('mascota_especies', 'id')],
        ];
    }
}
