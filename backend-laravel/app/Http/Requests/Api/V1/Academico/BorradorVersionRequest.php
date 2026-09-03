<?php

namespace App\Http\Requests\Api\V1\Academico;

use App\Enums\AudienciaAprendizaje;
use App\Enums\EtapaAprendizaje;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creación de un borrador a partir de una versión existente.
 *
 * Todos los campos son opcionales: por defecto el borrador hereda los
 * metadatos de la versión de origen.
 */
class BorradorVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'titulo' => ['nullable', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'audiencia' => ['nullable', Rule::in(AudienciaAprendizaje::values())],
            'etapa' => ['nullable', Rule::in(EtapaAprendizaje::values())],
        ];
    }

    /**
     * Sólo se propagan los campos realmente enviados; un null explícito no debe
     * borrar el metadato heredado.
     */
    public function validated($key = null, $default = null): array
    {
        return array_filter(parent::validated(), static fn ($valor): bool => $valor !== null);
    }
}
