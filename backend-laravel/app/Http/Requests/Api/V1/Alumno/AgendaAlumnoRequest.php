<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AgendaAlumnoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    protected function prepareForValidation(): void
    {
        $ahora = CarbonImmutable::now('UTC');

        $this->merge([
            'start' => $this->input('start', $ahora->toIso8601String()),
            'end' => $this->input('end', $ahora->addDays(30)->toIso8601String()),
        ]);
    }

    public function rules(): array
    {
        return [
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $inicio = CarbonImmutable::parse((string) $this->input('start'));
                $fin = CarbonImmutable::parse((string) $this->input('end'));

                if ($inicio->diffInDays($fin) > 93) {
                    $validator->errors()->add('end', 'El rango de agenda no puede superar 93 días.');
                }
            },
        ];
    }
}
