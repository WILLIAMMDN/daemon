<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validacion para confirmar la verificacion de correo a partir del
 * token JWT firmado por el backend. NO requiere sesion: el token ya
 * identifica al usuario (mismo patron que ConfirmarResetClaveRequest).
 */
class ConfirmarVerificacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'min:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'Falta el token de verificacion.',
            'token.min' => 'El token de verificacion es demasiado corto.',
        ];
    }
}