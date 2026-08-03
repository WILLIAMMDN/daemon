<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class ComandoCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'idempotencia' => ['required', 'string', 'min:16', 'max:220', 'regex:/^[A-Za-z0-9:_-]+$/'],
        ];
    }
}
