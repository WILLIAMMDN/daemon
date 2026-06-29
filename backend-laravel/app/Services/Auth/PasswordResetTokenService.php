<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;
use RuntimeException;
use UnexpectedValueException;

/**
 * Emite y valida tokens de recuperacion de clave firmados con la APP_KEY
 * de Laravel. A diferencia de FirebasePasswordResetLinkService, este
 * servicio NO delega en accounts:sendOobCode (que siempre envia el
 * email genérico de Firebase), sino que produce un JWT que nosotros
 * mismos distribuimos por correo con la plantilla de DAEMON.
 */
class PasswordResetTokenService
{
    private const PROPOSITO = 'recuperar_clave';

    private const MINUTOS_EXPIRACION = 60;

    /**
     * Genera la URL que se envia al usuario en el correo de recuperacion.
     */
    public function crear(Usuario $usuario): string
    {
        $ahora = time();
        $payload = [
            'sub' => self::PROPOSITO,
            'uid' => (string) $usuario->firebase_uid,
            'uid_local' => (int) $usuario->id,
            'email' => (string) $usuario->email,
            'iat' => $ahora,
            'exp' => $ahora + (self::MINUTOS_EXPIRACION * 60),
        ];

        $token = JWT::encode($payload, $this->clave(), 'HS256');

        $base = $this->urlResetFrontend();
        $separador = Str::contains($base, '?') ? '&' : '?';

        return $base.$separador.http_build_query([
            'token' => $token,
            'correo' => 1,
        ]);
    }

    /**
     * Verifica un token recibido desde el frontend y devuelve los datos
     * necesarios para resetear la clave. Lanza RuntimeException si el
     * token es invalido, expiro o no es de recuperacion de clave.
     *
     * @return array{uid: string, uid_local: int, email: string}
     */
    public function verificar(string $token): array
    {
        if (trim($token) === '') {
            throw new RuntimeException('El enlace de recuperacion no es valido.');
        }

        try {
            $decoded = JWT::decode($token, new Key($this->clave(), 'HS256'));
        } catch (UnexpectedValueException $exception) {
            throw new RuntimeException('El enlace de recuperacion no es valido.');
        }

        $payload = (array) $decoded;

        if (($payload['sub'] ?? null) !== self::PROPOSITO) {
            throw new RuntimeException('El enlace de recuperacion no es valido.');
        }

        if (empty($payload['uid']) || empty($payload['email'])) {
            throw new RuntimeException('El enlace de recuperacion no contiene los datos necesarios.');
        }

        return [
            'uid' => (string) $payload['uid'],
            'uid_local' => (int) ($payload['uid_local'] ?? 0),
            'email' => (string) $payload['email'],
        ];
    }

    private function clave(): string
    {
        $clave = (string) config('app.key', '');

        if ($clave === '') {
            throw new RuntimeException('APP_KEY no esta configurada; no se pueden emitir tokens de recuperacion.');
        }

        // Laravel guarda la clave con prefijo "base64:..." cuando fue generada
        // con php artisan key:generate. Hay que decodificarla para firmar
        // el JWT de forma simetrica.
        if (Str::startsWith($clave, 'base64:')) {
            $decoded = base64_decode(substr($clave, 7), true);

            if (is_string($decoded) && $decoded !== '') {
                return $decoded;
            }
        }

        return $clave;
    }

    private function urlResetFrontend(): string
    {
        $url = trim((string) config('services.firebase.password_reset_url', ''));

        if ($url !== '') {
            return $url;
        }

        return rtrim((string) env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')), '/').'/restablecer-clave';
    }
}