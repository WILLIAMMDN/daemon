<?php

namespace App\Http\Requests\Api\V1\Academico;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        $cursoId = $this->route('curso')?->id;

        return [
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id'],
            'titulo' => ['required', 'string', 'max:150'],
            'codigo' => ['nullable', 'string', 'max:60', Rule::unique('cursos', 'codigo')->where('id_institucion', $this->integer('id_institucion'))->ignore($cursoId)],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'nivel' => ['nullable', Rule::in(['KIDS', 'TEENS', 'TODOS'])],
            'estado' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}
