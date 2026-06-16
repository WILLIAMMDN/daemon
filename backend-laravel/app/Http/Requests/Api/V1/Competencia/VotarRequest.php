<?php

namespace App\Http\Requests\Api\V1\Competencia;

use Illuminate\Foundation\Http\FormRequest;

class VotarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'puntuacion' => ['required', 'integer', 'between:1,10'],
            'comentario' => ['nullable', 'string', 'max:200'],
        ];
    }
}
