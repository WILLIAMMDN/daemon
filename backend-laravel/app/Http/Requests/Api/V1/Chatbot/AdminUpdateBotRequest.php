<?php

namespace App\Http\Requests\Api\V1\Chatbot;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateBotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'nombre_bot' => ['nullable', 'string', 'max:100'],
            'system_prompt' => ['nullable', 'string'],
            'conocimiento' => ['nullable', 'string'],
            'nivel_entrenamiento' => ['nullable', 'integer', 'min:1', 'max:999'],
            'victorias' => ['nullable', 'integer', 'min:0', 'max:99999'],
            'avatar' => ['nullable', 'string', 'max:255'],
        ];
    }
}