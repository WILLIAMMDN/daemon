<?php

namespace App\Http\Requests\Api\V1\Evaluacion;

use Illuminate\Foundation\Http\FormRequest;

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
            'nivel' => ['sometimes', 'in:KIDS,TEENS,PRO'],
            'estado' => ['sometimes', 'in:borrador,activo,finalizado'],
        ];
    }
}
