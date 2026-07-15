<?php

namespace App\Http\Requests\Api\V1\Mision;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MisionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'recompensa' => ['required', 'integer', 'min:0'],
            'tipo_evidencia' => ['required', 'in:texto,archivo,imagen,video'],
            'nivel_requerido' => ['required', Rule::in(NivelAlumno::conAlcanceGeneral('TODOS'))],
            'estado' => ['nullable', 'in:activo,inactivo'],
            'es_mision_nivel' => ['nullable', 'boolean'],
        ];
    }
}
