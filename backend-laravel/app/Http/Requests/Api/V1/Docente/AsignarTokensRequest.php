<?php

namespace App\Http\Requests\Api\V1\Docente;

use Illuminate\Foundation\Http\FormRequest;

class AsignarTokensRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'id_alumno' => ['required', 'exists:usuarios,id'],
            'cantidad' => ['required', 'integer', 'between:-100000,100000'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ];
    }
}
