<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PeriodoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id'],
            'titulo' => ['required', 'string', 'max:150'],
            'tipo' => ['required', Rule::in(['schoolYear', 'term', 'gradingPeriod', 'semester'])],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'id_padre' => ['nullable', 'integer', 'exists:periodos_academicos,id'],
            'estado' => ['sometimes', Rule::in(['active', 'tobedeleted'])],
        ];
    }
}
