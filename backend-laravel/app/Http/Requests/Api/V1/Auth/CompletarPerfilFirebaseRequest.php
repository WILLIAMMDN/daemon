<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Enums\NivelAlumno;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompletarPerfilFirebaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_token' => ['required', 'string', 'max:8192'],
            'nombre_completo' => ['required', 'string', 'min:3', 'max:100'],
            'usuario' => ['required', 'alpha_dash', 'min:4', 'max:50'],
            'nivel' => ['required', Rule::in(NivelAlumno::values())],
        ];
    }
}
