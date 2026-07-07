<?php

namespace App\Http\Requests\Api\V1\IaModelo;

use Illuminate\Foundation\Http\FormRequest;

class IaModeloUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'nombre_proyecto' => ['nullable', 'string', 'max:100'],
            'modelo_json' => ['nullable', 'string'],
            'id_alumno' => ['nullable', 'integer', 'exists:usuarios,id'],
        ];
    }
}