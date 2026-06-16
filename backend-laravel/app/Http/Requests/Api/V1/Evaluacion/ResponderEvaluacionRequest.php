<?php

namespace App\Http\Requests\Api\V1\Evaluacion;

use Illuminate\Foundation\Http\FormRequest;

class ResponderEvaluacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'respuestas' => ['required', 'array'],
        ];
    }
}
