<?php

namespace App\Http\Requests\Api\V1\Academico;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SesionesCohorteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date', 'after:start'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $inicio = $this->input('start');
                $fin = $this->input('end');

                if (! $inicio || ! $fin) {
                    return;
                }

                if (CarbonImmutable::parse((string) $inicio)->diffInDays(CarbonImmutable::parse((string) $fin)) > 366) {
                    $validator->errors()->add('end', 'El rango de sesiones no puede superar 366 días.');
                }
            },
        ];
    }

    public function rangoInicio(): ?CarbonImmutable
    {
        $valor = $this->validated()['start'] ?? null;

        return $valor ? CarbonImmutable::parse((string) $valor) : null;
    }

    public function rangoFin(): ?CarbonImmutable
    {
        $valor = $this->validated()['end'] ?? null;

        return $valor ? CarbonImmutable::parse((string) $valor) : null;
    }
}
