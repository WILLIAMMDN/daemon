<?php

namespace App\Http\Requests\Api\V1\Cuento;

class PublicarCuentoV2AdminRequest extends ComandoCuentoV2Request
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            ...parent::rules(),
            'visibilidad' => ['required', 'in:aula,comunidad'],
        ];
    }
}
