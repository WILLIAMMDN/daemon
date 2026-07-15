<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompletarPerfilGoogleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => ['required', 'string', 'min:3', 'max:100'],
            'usuario' => [
                'required',
                'alpha_dash',
                'min:4',
                'max:50',
                Rule::unique('usuarios', 'usuario')->ignore($this->user()?->id),
            ],
            'nivel' => ['required', Rule::in(NivelAlumno::values())],
        ];
    }
}
