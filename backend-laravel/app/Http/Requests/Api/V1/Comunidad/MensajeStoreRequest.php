<?php

namespace App\Http\Requests\Api\V1\Comunidad;

use Illuminate\Foundation\Http\FormRequest;

class MensajeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'mensaje' => ['required', 'string', 'min:1', 'max:500'],
            'rol' => ['nullable', 'string', 'in:alumno,docente,admin'],
            'id_usuario' => ['nullable', 'integer', 'exists:usuarios,id'],
        ];
    }
}