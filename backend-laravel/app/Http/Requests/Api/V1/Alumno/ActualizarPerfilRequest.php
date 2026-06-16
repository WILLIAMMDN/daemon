<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarPerfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => ['sometimes', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:100'],
            'biografia' => ['nullable', 'string'],
            'genero' => ['nullable', 'string', 'max:20'],
            'avatar' => ['nullable', 'image', 'max:4096'],
            'fondo' => ['nullable', 'image', 'max:8192'],
            'heroe' => ['nullable', 'image', 'max:8192'],
        ];
    }
}
