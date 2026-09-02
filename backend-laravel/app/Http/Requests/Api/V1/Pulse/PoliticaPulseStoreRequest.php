<?php

namespace App\Http\Requests\Api\V1\Pulse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PoliticaPulseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'clave' => ['required', 'alpha_dash', 'max:100', 'unique:pulse_politicas_recompensa,clave'],
            'nombre' => ['required', 'string', 'max:150'],
            'tipo_evento' => ['required', Rule::in(config('pulse.allowed_events', []))],
            'tipo_experiencia' => ['nullable', 'string', 'max:40'],
            'id_version_curso' => ['nullable', 'integer', 'exists:versiones_curso,id'],
            'id_ruta_aprendizaje' => ['nullable', 'integer', 'exists:rutas_aprendizaje,id'],
            'xp' => ['required', 'integer', 'min:0', 'max:100000'],
            'daems' => ['required', 'integer', 'min:0', 'max:100000'],
            'repetibilidad' => ['required', Rule::in(['once_per_event', 'once_per_player', 'once_per_source', 'daily'])],
            'limite_diario' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'actividad_racha' => ['required', 'boolean'],
            'reglas_elegibilidad' => ['nullable', 'array'],
            'reglas_elegibilidad.audiencias' => ['sometimes', 'array'],
            'reglas_elegibilidad.audiencias.*' => [Rule::in(['KIDS', 'TEENS'])],
            'reglas_elegibilidad.puntaje_minimo' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'activa' => ['required', 'boolean'],
            'vigente_desde' => ['nullable', 'date'],
            'vigente_hasta' => ['nullable', 'date', 'after_or_equal:vigente_desde'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ((int) $this->input('xp', 0) === 0 && (int) $this->input('daems', 0) === 0 && ! $this->boolean('actividad_racha')) {
                $validator->errors()->add('xp', 'La política debe otorgar XP, Daems o calificar actividad de racha.');
            }
        }];
    }
}
