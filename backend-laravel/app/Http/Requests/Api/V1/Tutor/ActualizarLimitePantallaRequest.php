<?php

namespace App\Http\Requests\Api\V1\Tutor;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarLimitePantallaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'tutor';
    }

    public function rules(): array
    {
        return [
            'activo' => ['required', 'boolean'],
            'max_minutos_diarios' => ['required', 'integer', 'min:30', 'max:480'],
            'hora_silencio_inicio' => ['nullable', 'date_format:H:i', 'required_with:hora_silencio_fin'],
            'hora_silencio_fin' => ['nullable', 'date_format:H:i', 'required_with:hora_silencio_inicio'],
            'zona_horaria' => ['required', 'timezone'],
        ];
    }
}
