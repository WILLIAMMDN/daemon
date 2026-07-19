<?php

namespace App\Http\Requests\Api\V1\Mascota;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MascotaUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'nombre' => ['sometimes', 'nullable', 'string', 'max:30'],
            'id_especie' => [
                'sometimes',
                'integer',
                Rule::exists('mascota_especies', 'id')->where('activo', true),
            ],
        ];
    }
}
