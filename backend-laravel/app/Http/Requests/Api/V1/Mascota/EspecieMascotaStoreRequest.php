<?php

namespace App\Http\Requests\Api\V1\Mascota;

use Illuminate\Foundation\Http\FormRequest;

class EspecieMascotaStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:mascota_especies,codigo'],
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'asset_base' => ['required', 'string', 'max:255'],
            'asset_miniatura' => ['nullable', 'string', 'max:255'],
            'lienzo_ancho' => ['required', 'integer', 'min:256', 'max:4096'],
            'lienzo_alto' => ['required', 'integer', 'min:256', 'max:4096'],
            'orden' => ['nullable', 'integer', 'min:-32768', 'max:32767'],
            'activo' => ['nullable', 'boolean'],
        ];
    }
}
