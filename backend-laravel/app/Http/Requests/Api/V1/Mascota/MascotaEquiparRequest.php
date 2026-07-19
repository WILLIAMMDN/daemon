<?php

namespace App\Http\Requests\Api\V1\Mascota;

use Illuminate\Foundation\Http\FormRequest;

class MascotaEquiparRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return ['id_cosmetico' => ['required', 'integer', 'exists:mascota_cosmeticos,id']];
    }
}
