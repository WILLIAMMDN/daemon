<?php

namespace App\Http\Requests\Api\V1\Alumno;

use Illuminate\Foundation\Http\FormRequest;

class RegistrarUsoPantallaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'segundos' => ['required', 'integer', 'min:15', 'max:60'],
        ];
    }
}
