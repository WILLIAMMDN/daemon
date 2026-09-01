<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;

class EvaluarIntentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'aprobado' => ['required', 'boolean'],
            'puntaje' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comentario' => ['nullable', 'string', 'max:5000'],
            'criterios' => ['nullable', 'array'],
        ];
    }
}
