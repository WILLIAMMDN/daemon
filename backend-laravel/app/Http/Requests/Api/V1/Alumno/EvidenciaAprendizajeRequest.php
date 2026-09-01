<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvidenciaAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'tipo' => ['required', Rule::in(['assessment_result', 'submission', 'artifact', 'lab_output', 'practice_result', 'mission_delivery'])],
            'referencia' => ['nullable', 'string', 'max:2000'],
            'id_objetivo' => ['nullable', 'integer', 'exists:objetivos_aprendizaje,id'],
            'metadatos' => ['nullable', 'array'],
        ];
    }
}
