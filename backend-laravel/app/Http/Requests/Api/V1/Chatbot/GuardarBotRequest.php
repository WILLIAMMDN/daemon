<?php

namespace App\Http\Requests\Api\V1\Chatbot;

use Illuminate\Foundation\Http\FormRequest;

class GuardarBotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'nombre_bot' => ['required', 'string', 'max:100'],
            'system_prompt' => ['nullable', 'string'],
            'conocimiento' => ['nullable', 'string'],
            'avatar' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
