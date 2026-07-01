<?php

namespace App\Http\Requests\Api\V1\Docente;

use Illuminate\Foundation\Http\FormRequest;

class AulaStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        return [
            'id_institucion' => ['nullable', 'exists:instituciones,id'],
            'nombre' => ['required', 'string', 'max:120'],
            'nivel' => ['nullable', 'string', 'max:20'],
            'codigo' => ['nullable', 'string', 'max:40', 'unique:aulas,codigo'],
        ];
    }
}
