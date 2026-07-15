<?php

namespace App\Http\Requests\Api\V1\Auth\Concerns;

trait ValidaConsentimientoPrivacidad
{
    /** @return array<string, array<int, mixed>> */
    protected function reglasConsentimientoPrivacidad(): array
    {
        return [
            'acepta_privacidad' => ['required', 'accepted'],
            'email_tutor' => ['exclude_unless:nivel,KIDS', 'required', 'email', 'max:100'],
            'autorizacion_tutor_declarada' => ['exclude_unless:nivel,KIDS', 'required', 'accepted'],
        ];
    }

    /** @return array<string, string> */
    protected function mensajesConsentimientoPrivacidad(): array
    {
        return [
            'acepta_privacidad.accepted' => 'Debes aceptar la politica de privacidad para completar el perfil.',
            'acepta_privacidad.required' => 'Debes aceptar la politica de privacidad para completar el perfil.',
            'email_tutor.required' => 'Para KIDS necesitamos el correo de una madre, padre o tutor.',
            'email_tutor.email' => 'El correo del tutor no parece valido.',
            'autorizacion_tutor_declarada.accepted' => 'Confirma que tu madre, padre o tutor conoce la creacion de la cuenta KIDS.',
            'autorizacion_tutor_declarada.required' => 'Confirma que tu madre, padre o tutor conoce la creacion de la cuenta KIDS.',
        ];
    }
}
