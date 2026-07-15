<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Enums\NivelAlumno;
use App\Http\Requests\Api\V1\Auth\Concerns\ValidaConsentimientoPrivacidad;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validacion para completar el perfil luego del registro inicial.
 * El usuario llega aca desde /bienvenida con perfil_completo=false.
 * Los tres campos son obligatorios para que podamos marcar el perfil
 * como completo: nombre completo, handle (usuario unico) y nivel.
 *
 * usuario solo se exige si todavia no lo tiene, para no chocar con
 * el UNIQUE constraint ni obligar a renombrar una cuenta ya en uso.
 */
class ActualizarPerfilRequest extends FormRequest
{
    use ValidaConsentimientoPrivacidad;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var \App\Models\Usuario|null $usuario */
        $usuario = $this->user();

        return [
            'nombre_completo' => ['required', 'string', 'min:3', 'max:100'],
            'usuario' => [
                'required',
                'alpha_dash',
                'min:4',
                'max:50',
                Rule::unique('usuarios', 'usuario')->ignore($usuario?->id),
            ],
            'nivel' => ['required', Rule::in(NivelAlumno::values())],
            ...$this->reglasConsentimientoPrivacidad(),
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required' => 'Necesitamos tu nombre para personalizar tu cuenta.',
            'usuario.required' => 'Elige un nombre de usuario unico.',
            'usuario.alpha_dash' => 'El nombre de usuario solo puede tener letras, numeros, guiones y guion bajo.',
            'usuario.unique' => 'Ese nombre de usuario ya esta en uso.',
            'nivel.required' => 'Selecciona el nivel con el que empezar.',
            'nivel.in' => 'Ese nivel no es valido.',
            ...$this->mensajesConsentimientoPrivacidad(),
        ];
    }
}
