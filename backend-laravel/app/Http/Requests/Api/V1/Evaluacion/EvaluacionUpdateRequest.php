<?php

namespace App\Http\Requests\Api\V1\Evaluacion;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvaluacionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'string', 'max:100'],
            'nivel' => ['sometimes', Rule::in(NivelAlumno::values())],
            'estado' => ['sometimes', 'in:borrador,activo,finalizado'],
        ];
    }
}
