<?php

namespace App\Http\Requests\Api\V1\Evaluacion;

use Illuminate\Foundation\Http\FormRequest;

class EvaluacionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:100'],
            'nivel' => ['required', 'in:KIDS,TEENS,PRO'],
            'estado' => ['nullable', 'in:borrador,activo,finalizado'],
        ];
    }
}
