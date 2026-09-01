<?php

namespace App\Http\Requests\Api\V1\Academico;

use App\Enums\TipoExperienciaAprendizaje;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExperienciaAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'id_unidad' => ['nullable', 'integer', 'exists:unidades_curso,id'],
            'tipo' => ['required', Rule::in(TipoExperienciaAprendizaje::values())],
            'variante' => ['nullable', Rule::in(['boss'])],
            'titulo' => ['required', 'string', 'max:150'],
            'origen_tipo' => ['nullable', Rule::in(['leccion', 'mision', 'evaluacion', 'proyecto', 'laboratorio', 'practica', 'desafio'])],
            'origen_id' => ['nullable', 'integer', 'min:1', 'required_with:origen_tipo'],
            'orden' => ['required', 'integer', 'min:1', 'max:999'],
            'obligatoria' => ['sometimes', 'boolean'],
            'permite_intentos' => ['sometimes', 'boolean'],
            'max_intentos' => ['nullable', 'integer', 'min:1', 'max:100'],
            'regla_completitud' => ['nullable', 'array'],
            'regla_completitud.modo' => ['nullable', Rule::in(['manual_review', 'passing_score', 'submission', 'lesson_completion'])],
            'regla_completitud.puntaje_minimo' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'objetivos' => ['sometimes', 'array', 'max:50'],
            'objetivos.*' => ['integer', 'exists:objetivos_aprendizaje,id'],
        ];
    }
}
