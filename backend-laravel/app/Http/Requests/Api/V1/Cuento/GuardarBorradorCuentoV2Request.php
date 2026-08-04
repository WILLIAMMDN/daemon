<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class GuardarBorradorCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cuento_id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
            'version_id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
            'titulo' => ['nullable', 'string', 'max:120'],
            'sinopsis' => ['nullable', 'string', 'max:500'],
            'categoria' => ['nullable', 'string', 'max:50'],
            'rango_edad' => ['nullable', 'string', 'max:30'],
            'portada_ref' => ['nullable', 'string', 'max:512'],
            'revision_esperada' => ['required', 'integer', 'min:0', 'max:1000'],
            'paginas' => ['required', 'array', 'min:1', 'max:100'],
            'paginas.*.id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
            'paginas.*.orden' => ['required', 'integer', 'min:1', 'max:100'],
            'paginas.*.contenido' => ['nullable', 'string', 'max:20000'],
            'paginas.*.ilustracion_ref' => ['nullable', 'string', 'max:512'],
            'paginas.*.texto_alternativo' => ['nullable', 'string', 'max:250'],
            'paginas.*.fondo_token' => ['required', 'string', 'max:100'],
        ];
    }
}
