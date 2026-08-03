<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubirActivoCuentoV2Request extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'archivo' => [
                'required',
                'file',
                'max:'.(int) config('cuentos.activos_max_kb', 5120),
                'mimetypes:image/jpeg,image/png,image/webp,image/gif',
            ],
            'tipo' => ['required', Rule::in(['portada', 'ilustracion'])],
            'pagina_id' => ['nullable', 'required_if:tipo,ilustracion', 'string', 'regex:/^[A-Za-z0-9_-]{1,128}$/'],
            'idempotencia' => ['required', 'string', 'min:16', 'max:220', 'regex:/^[A-Za-z0-9:_-]+$/'],
        ];
    }
}
