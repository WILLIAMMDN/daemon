<?php

namespace App\Http\Requests\Api\V1\Privacidad;

use Illuminate\Foundation\Http\FormRequest;

class SolicitudEliminacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'confirmacion' => ['required', 'string', 'max:100'],
            'motivo' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
