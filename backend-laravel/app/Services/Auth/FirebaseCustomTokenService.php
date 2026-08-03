<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Emite Firebase custom tokens para usuarios autenticados en DAEMON
 * (login local con usuario/contrasena). Con esto Firestore Rules v2
 * (que exigen request.auth.uid) pueden autorizar a estos usuarios sin
 * debilitar la seguridad.
 *
 * Reconciliacion de identidad:
 *  1. Si el usuario ya tiene firebase_uid persistido, se reutiliza.
 *  2. Si tiene email y ese email ya existe en Firebase Auth (por un login
 *     previo con Google o email), se adopta ese UID para no partir la
 *     identidad del alumno entre dos cuentas.
 *  3. Si no existe cuenta previa, se deriva un UID determinista y estable
 *     ("daemon-{id}") que se persiste para futuras sesiones.
 */
final class FirebaseCustomTokenService
{
    private const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

    public function __construct(private readonly GoogleServiceAccountTokenService $google) {}

    public function configurado(): bool
    {
        return $this->google->configurado();
    }

    public function customTokenPara(Usuario $usuario): string
    {
        $uid = $this->resolverOReconciliarUid($usuario);

        return $this->google->customToken($uid);
    }

    public function resolverOReconciliarUid(Usuario $usuario): string
    {
        if (! empty($usuario->firebase_uid)) {
            return (string) $usuario->firebase_uid;
        }

        $uidPorEmail = null;
        if (! empty($usuario->email)) {
            $uidPorEmail = $this->buscarUidPorEmail((string) $usuario->email);
        }

        if ($uidPorEmail !== null) {
            $this->persistirUid($usuario, $uidPorEmail);

            return $uidPorEmail;
        }

        $uidDeterminista = 'daemon-'.$usuario->id;
        $this->persistirUid($usuario, $uidDeterminista);

        return $uidDeterminista;
    }

    private function buscarUidPorEmail(string $email): ?string
    {
        try {
            $respuesta = Http::withToken($this->google->token())
                ->post(self::LOOKUP_URL, [
                    'email' => [$email],
                ]);
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }

        if (! $respuesta->successful()) {
            return null;
        }

        $localId = $respuesta->json('users.0.localId');

        return is_string($localId) && $localId !== '' ? $localId : null;
    }

    private function persistirUid(Usuario $usuario, string $uid): void
    {
        if ($usuario->firebase_uid === $uid) {
            return;
        }

        $usuario->update(['firebase_uid' => $uid]);
    }
}
