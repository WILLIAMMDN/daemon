<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminAlumnoUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        $usuarioId = $this->route('usuario')?->id;

        return [
            'nombre_completo' => ['nullable', 'string', 'max:100'],
            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('usuarios', 'email')->ignore($usuarioId),
            ],
            'usuario' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[a-z0-9._-]+$/i',
                Rule::unique('usuarios', 'usuario')->ignore($usuarioId),
            ],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'nivel' => ['nullable', 'string', 'in:KIDS,TEENS,PRO,GENERAL'],
            'rol' => ['nullable', 'string', 'in:alumno,docente,admin'],
            'id_aula' => ['nullable', 'integer', 'exists:aulas,id'],
            'id_institucion' => ['nullable', 'integer', 'exists:instituciones,id'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'genero' => ['nullable', 'string', 'in:hombre,mujer,otro'],
            'rango' => ['nullable', 'string', 'max:50'],
            'biografia' => ['nullable', 'string', 'max:500'],
            'tokens' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'pro_tokens' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'perfil_completo' => ['nullable', 'boolean'],
        ];
    }
}