<?php

namespace App\Http\Requests\Api\V1\Competencia;

use Illuminate\Foundation\Http\FormRequest;

class ControlCompetenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'accion' => ['required', 'in:candidato,iniciar,cerrar,premiar,reiniciar'],
            'id_alumno' => ['nullable', 'exists:usuarios,id'],
            'duracion' => ['nullable', 'integer', 'between:10,600'],
            'puntos' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
