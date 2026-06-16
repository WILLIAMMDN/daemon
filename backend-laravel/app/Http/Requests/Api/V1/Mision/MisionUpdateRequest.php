<?php

namespace App\Http\Requests\Api\V1\Mision;

use Illuminate\Foundation\Http\FormRequest;

class MisionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'recompensa' => ['sometimes', 'integer', 'min:0'],
            'tipo_evidencia' => ['sometimes', 'in:texto,archivo,imagen,video'],
            'nivel_requerido' => ['sometimes', 'in:TODOS,KIDS,TEENS,PRO'],
            'estado' => ['nullable', 'in:activo,inactivo'],
            'es_mision_nivel' => ['nullable', 'boolean'],
        ];
    }
}
