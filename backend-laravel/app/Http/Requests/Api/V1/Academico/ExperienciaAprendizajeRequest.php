<?php

namespace App\Http\Requests\Api\V1\Academico;

use App\Enums\TipoExperienciaAprendizaje;
use App\Support\Academico\ContenidoEstructurado;
use App\Support\Academico\GuiaEntrega;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExperienciaAprendizajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    public function rules(): array
    {
        // En actualización sólo se validan los campos enviados; el servicio
        // aplica un merge parcial sobre la experiencia en borrador.
        $obligatorio = $this->esActualizacion() ? 'sometimes' : 'required';

        return [
            'id_unidad' => ['nullable', 'integer', 'exists:unidades_curso,id'],
            'tipo' => [$obligatorio, Rule::in(TipoExperienciaAprendizaje::values())],
            'variante' => ['nullable', Rule::in(['boss'])],
            'titulo' => [$obligatorio, 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'origen_tipo' => ['nullable', Rule::in(['leccion', 'mision', 'evaluacion', 'proyecto', 'laboratorio', 'practica', 'desafio'])],
            'origen_id' => ['nullable', 'integer', 'min:1', 'required_with:origen_tipo'],
            'orden' => [$obligatorio, 'integer', 'min:1', 'max:999'],
            'obligatoria' => ['sometimes', 'boolean'],
            'permite_intentos' => ['sometimes', 'boolean'],
            'max_intentos' => ['nullable', 'integer', 'min:1', 'max:100'],
            'regla_completitud' => ['nullable', 'array'],
            'regla_completitud.modo' => ['nullable', Rule::in(['manual_review', 'passing_score', 'submission', 'lesson_completion'])],
            'regla_completitud.puntaje_minimo' => ['nullable', 'numeric', 'min:0', 'max:100'],
            // Override explícito de revisión humana. Sin este campo el Learning
            // Core sigue derivando la exigencia del tipo de experiencia.
            'regla_completitud.revision_humana' => ['nullable', 'boolean'],
            'guia_entrega' => ['nullable', 'array'],
            'contenido' => ['nullable', 'array'],
            'objetivos' => ['sometimes', 'array', 'max:50'],
            'objetivos.*' => ['integer', 'exists:objetivos_aprendizaje,id'],
        ];
    }

    /**
     * Reglas de forma de las columnas JSON canónicas. Se validan como bloque
     * para no perder las claves pedagógicas históricas de `guia_entrega`.
     */
    public function withValidator(Validator $validador): void
    {
        $validador->after(function (Validator $validador): void {
            $guia = $this->input('guia_entrega');
            foreach (GuiaEntrega::errores(is_array($guia) ? $guia : null) as $error) {
                $validador->errors()->add('guia_entrega', $error);
            }

            $contenido = $this->input('contenido');
            foreach (ContenidoEstructurado::errores(is_array($contenido) ? $contenido : null) as $error) {
                $validador->errors()->add('contenido', $error);
            }
        });
    }

    private function esActualizacion(): bool
    {
        return in_array($this->method(), ['PUT', 'PATCH'], true);
    }
}
