<?php

namespace App\Http\Requests\Api\V1\Tutor;

use Illuminate\Foundation\Http\FormRequest;

class AceptarVinculoTutorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'tutor';
    }

    public function rules(): array
    {
        return [
            'parentesco' => ['required', 'string', 'in:madre,padre,tutor'],
        ];
    }
}
