<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validacion para pedir el reenvio del correo de verificacion.
 * Pensado para usuarios autenticados (usan /auth/me para chequear
 * el estado y disparan este endpoint si quieren que les reenviemos).
 * Aun asi, dejamos authorize() en true para soportar llamadas
 * externas; el controller filtrara por sesion Sanctum.
 */
class EnviarVerificacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}