<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmarResetClaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        // No requiere autenticacion: el token en si mismo prueba la
        // identidad del solicitante (es un JWT firmado con APP_KEY).
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'min:10'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'Falta el token de recuperacion.',
            'password.required' => 'La nueva contrasena es obligatoria.',
            'password.min' => 'La nueva contrasena debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmacion no coincide con la nueva contrasena.',
        ];
    }
}