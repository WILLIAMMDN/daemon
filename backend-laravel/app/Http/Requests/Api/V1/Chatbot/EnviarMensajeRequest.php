<?php

namespace App\Http\Requests\Api\V1\Chatbot;

use Illuminate\Foundation\Http\FormRequest;

class EnviarMensajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:10000'],
        ];
    }
}
