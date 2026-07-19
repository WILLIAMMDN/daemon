<?php

namespace App\Http\Requests\Api\V1\Tienda;

use App\Enums\MascotaRareza;
use App\Enums\MascotaSlot;
use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PremioStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'categoria' => ['required', Rule::in(NivelAlumno::conAlcanceGeneral('GENERAL'))],
            'tipo_entrega' => ['required', 'in:fisico,digital,cosmetico'],
            'codigos' => ['nullable', 'array'],
            'codigos.*.publico' => ['nullable', 'string', 'max:255'],
            'codigos.*.privado' => ['nullable', 'string', 'max:255'],
            'cosmetico' => ['required_if:tipo_entrega,cosmetico', 'array'],
            'cosmetico.codigo' => ['required_if:tipo_entrega,cosmetico', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:mascota_cosmeticos,codigo'],
            'cosmetico.slot' => ['required_if:tipo_entrega,cosmetico', Rule::enum(MascotaSlot::class)],
            'cosmetico.rareza' => ['required_if:tipo_entrega,cosmetico', Rule::enum(MascotaRareza::class)],
            'cosmetico.asset_capa' => ['required_if:tipo_entrega,cosmetico', 'string', 'max:255'],
            'cosmetico.asset_miniatura' => ['nullable', 'string', 'max:255'],
            'cosmetico.orden_capa' => ['required_if:tipo_entrega,cosmetico', 'integer', 'min:-32768', 'max:32767'],
            'cosmetico.activo' => ['nullable', 'boolean'],
            'cosmetico.especies' => ['required_if:tipo_entrega,cosmetico', 'array', 'min:1'],
            'cosmetico.especies.*' => ['integer', Rule::exists('mascota_especies', 'id')],
        ];
    }
}
