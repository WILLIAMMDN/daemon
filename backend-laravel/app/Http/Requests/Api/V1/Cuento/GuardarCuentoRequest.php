<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class GuardarCuentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'contenido' => ['nullable', 'string'],
        ];
    }
}
