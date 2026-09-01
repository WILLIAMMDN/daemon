<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SesionAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:4000'],
            'tipo' => ['sometimes', Rule::in(['live'])],
            'inicio_at' => ['required', 'date'],
            'fin_at' => ['nullable', 'date', 'after:inicio_at'],
            'estado' => ['sometimes', Rule::in(['scheduled', 'cancelled', 'completed'])],
            'acceso_url' => ['nullable', 'url:http,https', 'max:2000'],
        ];
    }
}
