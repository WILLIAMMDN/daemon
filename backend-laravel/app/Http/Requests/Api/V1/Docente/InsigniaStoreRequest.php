<?php

namespace App\Http\Requests\Api\V1\Docente;

use Illuminate\Foundation\Http\FormRequest;

class InsigniaStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'imagen' => ['nullable', 'required_without:archivo', 'string', 'max:255'],
            'archivo' => ['nullable', 'required_without:imagen', 'image', 'max:4096'],
        ];
    }
}
