<?php

namespace App\Http\Requests\Api\V1\Pulse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogroPulseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'clave_pulse' => ['required', 'alpha_dash', 'max:100', 'unique:insignias,clave_pulse'],
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['required', 'string', 'max:1000'],
            'imagen' => ['required', 'string', 'max:255'],
            'categoria' => ['required', 'string', 'max:60'],
            'activa' => ['required', 'boolean'],
            'repetible' => ['required', 'boolean'],
            'tipo_criterio' => ['required', Rule::in(['event_count', 'first_completion', 'course_completion', 'path_completion', 'streak_threshold', 'milestone_count'])],
            'configuracion_criterio' => ['present', 'array'],
            'configuracion_criterio.umbral' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'configuracion_criterio.tipos_evento' => ['sometimes', 'array'],
            'configuracion_criterio.tipos_evento.*' => [Rule::in(config('pulse.allowed_events', []))],
        ];
    }
}
