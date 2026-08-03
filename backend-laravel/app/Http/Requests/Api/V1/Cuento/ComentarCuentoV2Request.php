<?php

namespace App\Http\Requests\Api\V1\Cuento;

class ComentarCuentoV2Request extends ComandoCuentoV2Request
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'cuerpo' => ['required', 'string', 'max:1000'],
        ];
    }
}
