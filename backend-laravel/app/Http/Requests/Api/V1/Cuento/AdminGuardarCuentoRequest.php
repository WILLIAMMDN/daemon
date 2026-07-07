<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class AdminGuardarCuentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'id_alumno' => ['nullable', 'integer', 'exists:usuarios,id'],
            'titulo' => ['sometimes', 'required', 'string', 'max:160'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'texto' => ['sometimes', 'nullable', 'string'],
            'publicado' => ['sometimes', 'boolean'],
            'img_1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'img_2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'img_3' => ['sometimes', 'nullable', 'string', 'max:255'],
            'img_4' => ['sometimes', 'nullable', 'string', 'max:255'],
            'img_5' => ['sometimes', 'nullable', 'string', 'max:255'],
            'img_6' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}