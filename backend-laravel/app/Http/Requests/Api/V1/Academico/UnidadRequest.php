<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnidadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'orden' => ['required', 'integer', 'min:1', 'max:999'],
            'estado' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}
