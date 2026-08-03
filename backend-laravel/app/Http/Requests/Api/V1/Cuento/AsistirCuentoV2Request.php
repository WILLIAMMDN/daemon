<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AsistirCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'audiencia' => ['required', Rule::in(['KIDS', 'TEENS'])],
            'modo' => ['required', Rule::in([
                'ideas', 'continuar', 'titulo', 'personajes', 'escenarios',
                'revision', 'ayuda_guiada', 'adaptar_kids', 'adaptar_teens',
            ])],
            'titulo' => ['nullable', 'string', 'max:120'],
            'categoria' => ['nullable', 'string', 'max:50'],
            'banda_edad' => ['required', 'string', 'max:30'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'contenido_previo' => ['nullable', 'string', 'max:5000'],
            'limite_longitud' => ['required', 'integer', 'min:40', 'max:1500'],
            'objetivo_pedagogico' => ['required', 'string', 'max:240'],
            'idioma' => ['required', Rule::in(['es', 'es-PE'])],
        ];
    }
}
