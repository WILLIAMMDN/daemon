<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VincularCuentaLegacyFirebaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_token' => ['required', 'string', 'max:8192'],
            'usuario' => ['required', 'string', 'min:4', 'max:80'],
            'password' => ['required', 'string', 'min:3', 'max:128'],
        ];
    }
}
