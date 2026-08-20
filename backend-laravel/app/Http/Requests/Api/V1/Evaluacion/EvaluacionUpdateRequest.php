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
            'id_institucion' => ['sometimes', 'nullable', 'integer', 'exists:instituciones,id'],
            'id_aula' => ['sometimes', 'nullable', 'integer', 'exists:aulas,id'],
            'id_leccion' => ['sometimes', 'nullable', 'integer', 'exists:lecciones,id'],
            'puntaje_maximo' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'objetivos' => ['sometimes', 'array', 'max:50'],
            'objetivos.*' => ['integer', 'distinct', 'exists:objetivos_aprendizaje,id'],
        ];
    }
}
