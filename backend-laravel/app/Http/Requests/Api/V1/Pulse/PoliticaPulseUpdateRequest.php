<?php

namespace App\Http\Requests\Api\V1\Pulse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PoliticaPulseUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        $politica = $this->route('politica');

        return [
            'clave' => ['sometimes', 'alpha_dash', 'max:100', Rule::unique('pulse_politicas_recompensa', 'clave')->ignore($politica?->id)],
            'nombre' => ['sometimes', 'string', 'max:150'],
            'tipo_evento' => ['sometimes', Rule::in(config('pulse.allowed_events', []))],
            'tipo_experiencia' => ['sometimes', 'nullable', 'string', 'max:40'],
            'id_version_curso' => ['sometimes', 'nullable', 'integer', 'exists:versiones_curso,id'],
            'id_ruta_aprendizaje' => ['sometimes', 'nullable', 'integer', 'exists:rutas_aprendizaje,id'],
            'xp' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'daems' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'repetibilidad' => ['sometimes', Rule::in(['once_per_event', 'once_per_player', 'once_per_source', 'daily'])],
            'limite_diario' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000'],
            'actividad_racha' => ['sometimes', 'boolean'],
            'reglas_elegibilidad' => ['sometimes', 'nullable', 'array'],
            'reglas_elegibilidad.audiencias' => ['sometimes', 'array'],
            'reglas_elegibilidad.audiencias.*' => [Rule::in(['KIDS', 'TEENS'])],
            'reglas_elegibilidad.puntaje_minimo' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'activa' => ['sometimes', 'boolean'],
            'vigente_desde' => ['sometimes', 'nullable', 'date'],
            'vigente_hasta' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            $politica = $this->route('politica');
            $xp = (int) $this->input('xp', $politica?->xp ?? 0);
            $daems = (int) $this->input('daems', $politica?->daems ?? 0);
            $actividadRacha = $this->has('actividad_racha')
                ? $this->boolean('actividad_racha')
                : (bool) $politica?->actividad_racha;
            if ($xp === 0 && $daems === 0 && ! $actividadRacha) {
                $validator->errors()->add('xp', 'La política debe otorgar XP, Daems o calificar actividad de racha.');
            }
        }];
    }
}
