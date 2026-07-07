<?php

namespace App\Http\Requests\Api\V1\Institucion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InstitucionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'admin';
    }

    public function rules(): array
    {
        $institucionId = $this->route('institucion')?->id;

        return [
            'nombre' => ['nullable', 'string', 'max:150'],
            'slug' => [
                'nullable',
                'string',
                'max:80',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('instituciones', 'slug')->ignore($institucionId),
            ],
        ];
    }
}