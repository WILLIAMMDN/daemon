<?php

namespace App\Http\Requests\Api\V1\Tienda;

use App\Enums\NivelAlumno;
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
        return [
            'nombre' => ['sometimes', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'imagen' => ['nullable', 'string', 'max:255'],
            'categoria' => ['sometimes', Rule::in(NivelAlumno::conAlcanceGeneral('GENERAL'))],
            'tipo_entrega' => ['sometimes', 'in:fisico,digital'],
        ];
    }
}
