<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Operaciones administrativas sobre Firebase Auth ejecutadas con la
 * cuenta de servicio (FIREBASE_SERVICE_ACCOUNT_BASE64). Hoy expone
 * updatePassword; mas adelante se pueden agregar setEmail, disable, etc.
 */
class FirebaseAdminService
{
    public function __construct(private readonly GoogleServiceAccountTokenService $google) {}

    /**
     * Cambia la contrasena de un usuario en Firebase Auth (buscandolo
     * por su firebase_uid). NO requiere que el usuario este autenticado,
     * porque usa el token de la cuenta de servicio.
     */
    public function updatePassword(string $uid, string $nuevaContrasena): void
    {
        $projectId = trim((string) config('services.firebase.project_id', ''));

        if ($projectId === '') {
            throw new RuntimeException('FIREBASE_PROJECT_ID no esta configurado.');
        }

        if (trim($uid) === '') {
            throw new RuntimeException('No se puede actualizar la clave: firebase_uid vacio.');
        }

        try {
            $respuesta = Http::withToken($this->google->token())->post(
                "https://identitytoolkit.googleapis.com/v1/projects/{$projectId}/accounts:update",
                [
                    'localId' => $uid,
                    'password' => $nuevaContrasena,
                    'returnUserInfo' => false,
                ],
            );
        } catch (Throwable $exception) {
            Log::error('Fallo de red al actualizar clave en Firebase.', [
                'uid' => $uid,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException('No se pudo contactar a Firebase para actualizar la clave.');
        }

        if (! $respuesta->successful()) {
            Log::warning('Firebase rechazo el cambio de clave.', [
                'uid' => $uid,
                'status' => $respuesta->status(),
                'body' => $respuesta->body(),
            ]);

            $mensaje = $respuesta->json('error.message') ?? 'Firebase no pudo actualizar la clave.';

            throw new RuntimeException($mensaje);
        }
    }
}