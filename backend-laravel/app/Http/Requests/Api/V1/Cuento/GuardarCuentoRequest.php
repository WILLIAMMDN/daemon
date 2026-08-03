<?php

namespace App\Http\Requests\Api\V1\Cuento;

use Illuminate\Foundation\Http\FormRequest;

class GuardarCuentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        $rules = [
            'titulo' => ['required', 'string', 'max:150'],
            // Limite de tamano para evitar abuso / DoS de almacenamiento.
            // 200 KB alcanza para ~50k palabras en HTML rico, mucho mas
            // que cualquier cuento que un estudiante pueda escribir.
            // El sanitizer final aplica su propio limite (defensa en profundidad).
            'contenido' => ['nullable', 'string', 'max:204800'],
        ];

        foreach (range(1, 6) as $indice) {
            $rules['img_'.$indice] = ['nullable', 'string', 'max:255'];
            $rules['pos_'.$indice] = ['nullable', 'string', 'max:20'];
            $rules['data_'.$indice] = ['nullable', 'string', 'max:204800'];
        }

        return $rules;
    }
}
