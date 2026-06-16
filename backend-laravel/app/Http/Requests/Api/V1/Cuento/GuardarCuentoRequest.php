<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class GuardarCuentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        $reglas = [
            'titulo' => ['required', 'string', 'max:150'],
        ];

        foreach (range(1, 6) as $i) {
            $reglas["img_$i"] = ['nullable', 'string'];
            $reglas["data_$i"] = ['nullable'];
            $reglas["pos_$i"] = ['nullable', 'string', 'max:20'];
        }

        return $reglas;
    }
}
