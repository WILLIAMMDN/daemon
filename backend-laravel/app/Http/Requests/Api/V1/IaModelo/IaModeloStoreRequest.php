<?php

namespace App\Http\Requests\Api\V1\IaModelo;

use Illuminate\Foundation\Http\FormRequest;

class IaModeloStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'id_alumno' => ['required', 'integer', 'exists:usuarios,id'],
            'nombre_proyecto' => ['required', 'string', 'max:100'],
            'modelo_json' => ['nullable', 'string'],
        ];
    }
}