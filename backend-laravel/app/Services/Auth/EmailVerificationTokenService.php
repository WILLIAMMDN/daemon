<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;
use RuntimeException;
use UnexpectedValueException;

/**
 * Emite y valida tokens de verificacion de correo firmados con la APP_KEY
 * de Laravel. Igual que PasswordResetTokenService: NO delega en
 * accounts:sendOobCode (que envia el email generico de Firebase). Produce
 * un JWT que nosotros mismos distribuimos con la plantilla DAEMON.
 *
 * El token es de un solo uso desde el punto de vista funcional (la primera
 * confirmacion marca el correo como verificado), pero a nivel firma sigue
 * siendo valido hasta su exp. Eso permite al usuario re-clicar enlaces
 * viejos sin error tecnico, aunque ya no tendra efecto.
 */
class EmailVerificationTokenService
{
    private const PROPOSITO = 'verificar_correo';

    /**
     * 24 horas: el usuario tiene tiempo de revisar su correo, pero si
     * tarda mas debera solicitar uno nuevo. Es un equilibrio entre
     * friccion nula y superficie de ataque reducida.
     */
    private const MINUTOS_EXPIRACION = 24 * 60;

    public function crear(Usuario $usuario): string
    {
        if (! $usuario->email) {
            throw new RuntimeException('El usuario no tiene un correo electronico para verificar.');
        }

        $ahora = time();
        $payload = [
            'sub' => self::PROPOSITO,
            'uid_local' => (int) $usuario->id,
            'email' => (string) $usuario->email,
            'iat' => $ahora,
            'exp' => $ahora + (self::MINUTOS_EXPIRACION * 60),
        ];

        $token = JWT::encode($payload, $this->clave(), 'HS256');

        $base = $this->urlVerificacionFrontend();
        $separador = Str::contains($base, '?') ? '&' : '?';

        return $base.$separador.http_build_query([
            'token' => $token,
        ]);
    }

    /**
     * Verifica un token recibido desde el frontend y devuelve los datos
     * del usuario. Lanza RuntimeException si es invalido, expiro, o no
     * es de verificacion de correo.
     *
     * @return array{uid_local: int, email: string}
     */
    public function verificar(string $token): array
    {
        if (trim($token) === '') {
            throw new RuntimeException('El enlace de verificacion no es valido.');
        }

        try {
            $decoded = JWT::decode($token, new Key($this->clave(), 'HS256'));
        } catch (UnexpectedValueException $exception) {
            throw new RuntimeException('El enlace de verificacion no es valido.');
        }

        $payload = (array) $decoded;

        if (($payload['sub'] ?? null) !== self::PROPOSITO) {
            throw new RuntimeException('El enlace de verificacion no es valido.');
        }

        if (empty($payload['email']) || empty($payload['uid_local'])) {
            throw new RuntimeException('El enlace de verificacion no contiene los datos necesarios.');
        }

        return [
            'uid_local' => (int) $payload['uid_local'],
            'email' => (string) $payload['email'],
        ];
    }

    private function clave(): string
    {
        $clave = (string) config('app.key', '');

        if ($clave === '') {
            throw new RuntimeException('APP_KEY no esta configurada; no se pueden emitir tokens de verificacion.');
        }

        // Laravel guarda la clave con prefijo "base64:..." cuando fue
        // generada con php artisan key:generate. Hay que decodificarla
        // para firmar el JWT de forma simetrica.
        if (Str::startsWith($clave, 'base64:')) {
            $decoded = base64_decode(substr($clave, 7), true);

            if (is_string($decoded) && $decoded !== '') {
                return $decoded;
            }
        }

        return $clave;
    }

    private function urlVerificacionFrontend(): string
    {
        $explicita = trim((string) env('FRONTEND_EMAIL_VERIFICATION_URL', ''));
        if ($explicita !== '') {
            return $explicita;
        }

        $base = rtrim((string) env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')), '/');

        return $base.'/verificar-correo';
    }
}