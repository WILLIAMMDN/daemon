<?php

namespace App\Http\Requests\Api\V1\Evaluacion;

use Illuminate\Foundation\Http\FormRequest;

class GuardarPreguntasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'preguntas' => ['required', 'array', 'min:1'],
            'preguntas.*.enunciado' => ['required', 'string'],
            'preguntas.*.tipo' => ['required', 'in:opcion_multiple,verdadero_falso,texto'],
            'preguntas.*.opciones' => ['nullable', 'array'],
            'preguntas.*.respuesta_correcta' => ['required', 'string'],
        ];
    }
}
