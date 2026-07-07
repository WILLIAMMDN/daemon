<?php

namespace App\Http\Requests\Api\V1\Mision;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyMisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'exists:desafios,id'],
        ];
    }
}