<?php

namespace App\Http\Requests\Api\V1\Alumno;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminAlumnoStoreRequest extends FormRequest
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
            'usuario' => ['required', 'string', 'max:50', 'unique:usuarios,usuario', 'regex:/^[a-z0-9._-]+$/i'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'nivel' => ['required', 'string', Rule::in(NivelAlumno::values())],
            'rol' => ['required', 'string', 'in:alumno,docente,admin'],
            'id_aula' => ['nullable', 'integer', 'exists:aulas,id'],
            'id_institucion' => ['nullable', 'integer', 'exists:instituciones,id'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'genero' => ['nullable', 'string', 'in:hombre,mujer,otro'],
            'rango' => ['nullable', 'string', 'max:50'],
            'tokens_iniciales' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'pro_tokens_iniciales' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ];
    }
}
