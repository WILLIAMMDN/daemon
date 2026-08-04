<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class ReservarBorradorCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cuento_id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
            'version_id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
        ];
    }
}
