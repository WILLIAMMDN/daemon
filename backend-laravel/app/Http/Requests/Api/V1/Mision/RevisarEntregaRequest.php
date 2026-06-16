<?php

namespace App\Http\Requests\Api\V1\Mision;

use Illuminate\Foundation\Http\FormRequest;

class RevisarEntregaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', 'in:aprobado,rechazado'],
            'calificacion' => ['nullable', 'integer', 'min:0'],
            'comentario_docente' => ['nullable', 'string'],
        ];
    }
}
