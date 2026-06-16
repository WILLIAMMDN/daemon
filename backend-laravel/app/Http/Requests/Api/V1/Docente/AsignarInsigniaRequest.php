<?php

namespace App\Http\Requests\Api\V1\Docente;

use Illuminate\Foundation\Http\FormRequest;

class AsignarInsigniaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'id_alumno' => ['required', 'exists:usuarios,id'],
            'id_insignia' => ['required', 'exists:insignias,id'],
            'asignar' => ['boolean'],
        ];
    }
}
