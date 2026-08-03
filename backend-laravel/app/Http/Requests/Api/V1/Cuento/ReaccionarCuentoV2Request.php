<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReaccionarCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tipo' => ['present', 'nullable', Rule::in([
                'encanto',
                'increible',
                'gusto',
                'sorprendio',
                'interesante',
            ])],
            'idempotencia' => ['required', 'string', 'min:16', 'max:220', 'regex:/^[A-Za-z0-9:_-]+$/'],
        ];
    }
}
