<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrearUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:100', 'unique:usuarios,email'],
            'telefono' => ['nullable', 'string', 'max:30', 'unique:usuarios,telefono'],
            'usuario' => ['required', 'alpha_dash', 'max:50', 'unique:usuarios,usuario'],
            'password' => ['required', 'string', 'min:8'],
            'nivel' => ['nullable', Rule::in(NivelAlumno::values())],
            'rol' => ['required', 'in:alumno,docente,admin'],
        ];
    }
}
