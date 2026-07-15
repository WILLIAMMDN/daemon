<?php

namespace App\Http\Requests\Api\V1\Docente;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AulaUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['admin', 'docente'], true);
    }

    public function rules(): array
    {
        $aulaId = $this->route('aula')?->id ?? $this->route('aula');

        return [
            'nombre' => ['sometimes', 'required', 'string', 'max:120'],
            'nivel' => ['sometimes', 'nullable', 'string', Rule::in(NivelAlumno::values())],
            'codigo' => [
                'sometimes',
                'nullable',
                'string',
                'max:40',
                Rule::unique('aulas', 'codigo')->ignore($aulaId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del aula es obligatorio.',
            'codigo.unique' => 'Ya existe otra aula con ese codigo.',
        ];
    }
}
