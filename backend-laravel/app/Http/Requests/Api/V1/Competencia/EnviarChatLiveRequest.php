<?php

namespace App\Http\Requests\Api\V1\Competencia;

use Illuminate\Foundation\Http\FormRequest;

class EnviarChatLiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'mensaje' => ['required', 'string', 'max:500'],
        ];
    }
}
