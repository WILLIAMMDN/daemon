<?php

namespace App\Http\Requests\Api\V1\Tienda;

use Illuminate\Foundation\Http\FormRequest;

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
            'categoria' => ['required', 'in:TEENS,KIDS,PRO,GENERAL'],
            'tipo_entrega' => ['required', 'in:fisico,digital'],
            'codigos' => ['nullable', 'array'],
            'codigos.*.publico' => ['nullable', 'string', 'max:255'],
            'codigos.*.privado' => ['nullable', 'string', 'max:255'],
        ];
    }
}
