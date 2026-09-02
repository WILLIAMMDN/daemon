<?php

namespace App\Http\Requests\Api\V1\Pulse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogroPulseUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        $logro = $this->route('logro');

        return [
            'clave_pulse' => ['sometimes', 'alpha_dash', 'max:100', Rule::unique('insignias', 'clave_pulse')->ignore($logro?->id)],
            'nombre' => ['sometimes', 'string', 'max:100'],
            'descripcion' => ['sometimes', 'string', 'max:1000'],
            'imagen' => ['sometimes', 'string', 'max:255'],
            'categoria' => ['sometimes', 'string', 'max:60'],
            'activa' => ['sometimes', 'boolean'],
            'repetible' => ['sometimes', 'boolean'],
            'tipo_criterio' => ['sometimes', Rule::in(['event_count', 'first_completion', 'course_completion', 'path_completion', 'streak_threshold', 'milestone_count'])],
            'configuracion_criterio' => ['sometimes', 'array'],
            'configuracion_criterio.umbral' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'configuracion_criterio.tipos_evento' => ['sometimes', 'array'],
            'configuracion_criterio.tipos_evento.*' => [Rule::in(config('pulse.allowed_events', []))],
        ];
    }
}
