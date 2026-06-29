<?php

namespace App\Services\Auth;

use App\Mail\VerificarCorreoMail;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Orquesta el flujo de verificacion de correo electronico:
 *  - solicitar(Usuario): genera el JWT y manda el correo via Resend.
 *  - confirmar(string $token): valida el JWT y marca email_verified_at.
 *
 * Sigue el mismo patron que RecuperacionClaveService: nunca revela si
 * una cuenta existe, separa el fallo de envio del flujo principal, y
 * registra con error_log para diagnostico en Render.
 */
class EmailVerificationService
{
    public function __construct(
        private readonly EmailVerificationTokenService $tokens,
    ) {}

    /**
     * Envia el correo de verificacion al usuario. No-op si la cuenta ya
     * esta verificada (idempotencia: si el usuario pide reenviar y ya
     * esta OK, no mandamos otro correo).
     *
     * Si el envio falla por error de transporte, lo logueamos pero NO
     * propagamos la excepcion: la verificacion de email es un "nice to
     * have" en el flujo de registro y no queremos romper el alta del
     * usuario solo porque Brevo/Resend se cayo un segundo.
     */
    public function solicitar(Usuario $usuario, bool $forzar = false): bool
    {
        if (! $usuario->email) {
            return false;
        }

        if ($usuario->hasVerifiedEmail()) {
            return false;
        }

        try {
            $link = $this->tokens->crear($usuario);
            $mailer = (string) config('mail.default');

            error_log(sprintf(
                '[mail-verify] enviar uid=%d to=%s mailer=%s',
                $usuario->id,
                $usuario->email,
                $mailer,
            ));

            Mail::to($usuario->email)->send(new VerificarCorreoMail($usuario, $link));

            error_log(sprintf('[mail-verify] enviado uid=%d', $usuario->id));

            return true;
        } catch (Throwable $exception) {
            Log::warning('Fallo el envio del correo de verificacion.', [
                'uid' => $usuario->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
            error_log(sprintf(
                '[mail-verify] ERROR uid=%d ex=%s msg=%s',
                $usuario->id,
                $exception::class,
                $exception->getMessage(),
            ));

            return false;
        }
    }

    /**
     * Valida el token JWT recibido desde el frontend y marca el correo
     * como verificado en la base de datos. Devuelve el Usuario actualizado.
     *
     * Lanza RuntimeException si:
     *  - el token es invalido o expiro
     *  - la cuenta fue borrada mientras tanto
     *  - el correo del token no coincide con el correo actual de la cuenta
     *    (caso edge: alguien cambio el email entre el envio y el clic)
     */
    public function confirmar(string $token): Usuario
    {
        $payload = $this->tokens->verificar($token);
        $usuario = Usuario::find($payload['uid_local']);

        if (! $usuario) {
            throw new \RuntimeException('La cuenta asociada al enlace ya no existe.');
        }

        // El usuario pudo haber cambiado su correo despues del envio
        // (registro re-actualizado). Si el email del token ya no coincide,
        // rechazamos: el enlace era para otro correo.
        if (strcasecmp((string) $usuario->email, (string) $payload['email']) !== 0) {
            throw new \RuntimeException('El enlace no corresponde al correo actual de la cuenta.');
        }

        $antes = $usuario->hasVerifiedEmail();
        $usuario->markEmailAsVerified();

        if (! $antes) {
            error_log(sprintf(
                '[mail-verify] confirmado uid=%d email=%s',
                $usuario->id,
                (string) $usuario->email,
            ));
        }

        return $usuario->refresh();
    }
}
