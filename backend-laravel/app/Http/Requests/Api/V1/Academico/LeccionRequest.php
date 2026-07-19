<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeccionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'resumen' => ['nullable', 'string', 'max:5000'],
            'contenido' => ['nullable', 'array'],
            'contenido.*.tipo' => ['required_with:contenido', Rule::in(['texto', 'video', 'audio', 'imagen', 'archivo', 'actividad', 'embed'])],
            'contenido.*.valor' => ['required_with:contenido', 'string', 'max:20000'],
            'orden' => ['required', 'integer', 'min:1', 'max:999'],
            'duracion_minutos' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'estado' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'objetivos' => ['sometimes', 'array', 'max:50'],
            'objetivos.*' => ['integer', 'exists:objetivos_aprendizaje,id'],
        ];
    }
}
