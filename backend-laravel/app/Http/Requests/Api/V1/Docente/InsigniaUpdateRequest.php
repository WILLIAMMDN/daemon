<?php

namespace App\Http\Requests\Api\V1\Docente;

use Illuminate\Foundation\Http\FormRequest;

class InsigniaUpdateRequest extends FormRequest
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
            'imagen' => ['sometimes', 'string', 'max:255'],
            'archivo' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
