<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Illuminate\Foundation\Http\FormRequest;

class IniciarIntentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return ['idempotency_key' => ['required', 'string', 'max:190']];
    }
}
