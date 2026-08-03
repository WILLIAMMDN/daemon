<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class GestionarActivoCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'referencia' => ['required', 'string', 'max:512', 'starts_with:storage://'],
        ];
    }
}
