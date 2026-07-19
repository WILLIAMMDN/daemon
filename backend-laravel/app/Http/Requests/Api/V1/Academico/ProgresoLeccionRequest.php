<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProgresoLeccionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(['notStarted', 'inProgress', 'completed'])],
            'porcentaje' => ['required', 'integer', 'min:0', 'max:100'],
            'evidencia' => ['nullable', 'array'],
        ];
    }
}
