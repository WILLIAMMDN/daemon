<?php

namespace App\Http\Requests\Api\V1\Academico;

use App\Enums\AudienciaAprendizaje;
use App\Enums\EtapaAprendizaje;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RutaAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'audiencia' => ['required', Rule::in(AudienciaAprendizaje::values())],
            'etapa' => ['required', Rule::in(EtapaAprendizaje::values())],
        ];
    }
}
