<?php

namespace App\Http\Requests\Api\V1\Mascota;

use App\Models\EspecieMascota;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EspecieMascotaUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        /** @var EspecieMascota|null $especie */
        $especie = $this->route('especie');

        return [
            'codigo' => ['sometimes', 'string', 'max:60', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('mascota_especies', 'codigo')->ignore($especie?->id)],
            'nombre' => ['sometimes', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'asset_base' => ['sometimes', 'string', 'max:255'],
            'asset_miniatura' => ['nullable', 'string', 'max:255'],
            'lienzo_ancho' => ['sometimes', 'integer', 'min:256', 'max:4096'],
            'lienzo_alto' => ['sometimes', 'integer', 'min:256', 'max:4096'],
            'orden' => ['sometimes', 'integer', 'min:-32768', 'max:32767'],
            'activo' => ['sometimes', 'boolean'],
        ];
    }
}
