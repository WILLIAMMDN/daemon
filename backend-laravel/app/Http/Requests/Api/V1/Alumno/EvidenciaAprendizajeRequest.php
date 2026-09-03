<?php

namespace App\Http\Requests\Api\V1\Alumno;

use App\Enums\TipoExperienciaAprendizaje;
use App\Models\IntentoAprendizaje;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvidenciaAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        $requiereExplicacion = $this->requiereExplicacionRevision();

        return [
            'tipo' => ['required', Rule::in(['assessment_result', 'submission', 'artifact', 'lab_output', 'practice_result', 'mission_delivery'])],
            'referencia' => ['nullable', 'string', 'max:2000'],
            'id_objetivo' => ['nullable', 'integer', 'exists:objetivos_aprendizaje,id'],
            'metadatos' => ['nullable', 'array'],
            'metadatos.revision' => [$requiereExplicacion ? 'required' : 'nullable', 'array'],
            'metadatos.revision.whatChanged' => [$requiereExplicacion ? 'required' : 'nullable', 'string', 'max:1000'],
            'metadatos.revision.whyChanged' => [$requiereExplicacion ? 'required' : 'nullable', 'string', 'max:1000'],
            'metadatos.revision.feedbackUsed' => [$requiereExplicacion ? 'required' : 'nullable', 'string', 'max:1000'],
        ];
    }

    private function requiereExplicacionRevision(): bool
    {
        $intento = $this->route('intento');
        if (is_numeric($intento)) {
            $intento = IntentoAprendizaje::find((int) $intento);
        }
        if (! $intento instanceof IntentoAprendizaje || $intento->numero <= 1) {
            return false;
        }

        $tipo = $intento->experiencia()->value('tipo');

        return in_array($tipo, [
            TipoExperienciaAprendizaje::MISION->value,
            TipoExperienciaAprendizaje::EVALUACION->value,
            TipoExperienciaAprendizaje::PROYECTO->value,
        ], true);
    }
}
