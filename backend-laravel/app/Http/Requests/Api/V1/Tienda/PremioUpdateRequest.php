<?php

namespace App\Http\Requests\Api\V1\Tienda;

use Illuminate\Foundation\Http\FormRequest;

class PremioUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'nombre' => ['sometimes', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'categoria' => ['sometimes', 'in:TEENS,KIDS,PRO,GENERAL'],
            'tipo_entrega' => ['sometimes', 'in:fisico,digital'],
        ];
    }
}
