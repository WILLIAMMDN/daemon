<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Registro de alumno con friction minima: solo email + password
 * son requeridos. El resto del perfil (nombre, usuario, nivel) se
 * completa despues desde /bienvenida una vez que el usuario ya
 * esta autenticado.
 *
 * El backend crea la fila con perfil_completo=false y nombre/
 * usuario/nivel en NULL. La pagina /bienvenida hace el PATCH
 * /auth/me/perfil correspondiente y recien ahi queda perfil_completo=true.
 *
 * Si vienen campos extra en el request (compatibilidad con clientes
 * viejos), los aceptamos pero no los exigimos.
 */
class RegistroAlumnoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:100', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],

            // Opcionales para compat: si vienen los aceptamos, pero
            // el endpoint PATCH /auth/me/perfil es la forma canonica
            // de completar el perfil en el nuevo flujo.
            'nombre_completo' => ['nullable', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:30', 'unique:usuarios,telefono'],
            'usuario' => ['nullable', 'alpha_dash', 'max:50', 'unique:usuarios,usuario'],
            'nivel' => ['nullable', Rule::in(NivelAlumno::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Necesitamos tu correo electronico para crear la cuenta.',
            'email.email' => 'Ese correo no parece valido.',
            'email.unique' => 'Ya existe una cuenta registrada con ese correo.',
            'password.required' => 'Define una clave para proteger tu cuenta.',
            'password.min' => 'La clave debe tener al menos 8 caracteres.',
        ];
    }
}
