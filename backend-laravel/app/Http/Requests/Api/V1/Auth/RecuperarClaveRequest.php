<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RecuperarClaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'usuario' => ['nullable', 'string', 'required_without:email'],
            'email' => ['nullable', 'email', 'required_without:usuario'],
        ];
    }
}
