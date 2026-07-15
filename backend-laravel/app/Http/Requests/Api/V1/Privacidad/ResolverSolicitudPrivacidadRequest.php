<?php

namespace App\Http\Requests\Api\V1\Privacidad;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolverSolicitudPrivacidadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(['en_revision', 'completada', 'rechazada'])],
            'resolucion' => ['required', 'string', 'max:2000'],
        ];
    }
}
