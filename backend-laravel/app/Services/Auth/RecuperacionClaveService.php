<?php

namespace App\Services\Auth;

use App\Mail\RecuperarClaveMail;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Throwable;

class RecuperacionClaveService
{
    public function __construct(
        private readonly PasswordResetTokenService $tokens,
        private readonly FirebaseAdminService $firebaseAdmin,
    ) {}

    public function solicitar(array $datos): void
    {
        $usuario = $this->buscarUsuario($datos);

        if (! $usuario?->email) {
            return;
        }

        try {
            $link = $this->tokens->crear($usuario);
            $mailer = config('mail.default');
            $fromAddress = config('mail.from.address');
            $host = config('mail.mailers.smtp.host');
            $port = config('mail.mailers.smtp.port');
            $usernameSet = filled(config('mail.mailers.smtp.username'));
            $passwordSet = filled(config('mail.mailers.smtp.password'));
            $encryption = config('mail.mailers.smtp.encryption');

            error_log(sprintf(
                '[mail-recovery] intentando enviar uid=%d to=%s mailer=%s from=%s host=%s port=%s enc=%s user_ok=%d pass_ok=%d',
                $usuario->id,
                $usuario->email,
                (string) $mailer,
                (string) $fromAddress,
                (string) $host,
                (string) $port,
                (string) ($encryption ?? 'null'),
                $usernameSet ? 1 : 0,
                $passwordSet ? 1 : 0,
            ));

            $sent = Mail::to($usuario->email)->send(new RecuperarClaveMail($usuario, $link));

            error_log(sprintf(
                '[mail-recovery] Mail::send retorno=%s uid=%d',
                var_export($sent, true),
                $usuario->id,
            ));
        } catch (Throwable $exception) {
            error_log(sprintf(
                '[mail-recovery] ERROR uid=%d ex_class=%s ex_msg=%s ex_code=%s',
                $usuario->id,
                $exception::class,
                $exception->getMessage(),
                (string) $exception->getCode(),
            ));
            $previous = $exception->getPrevious();
            $i = 0;
            while ($previous instanceof Throwable && $i < 5) {
                error_log(sprintf(
                    '[mail-recovery] ERROR uid=%d chain[%d] class=%s msg=%s code=%s',
                    $usuario->id,
                    $i,
                    $previous::class,
                    $previous->getMessage(),
                    (string) $previous->getCode(),
                ));
                $previous = $previous->getPrevious();
                $i++;
            }

            // Connectivity probe — see if Render can even reach the SMTP host:port
            try {
                $sock = @stream_socket_client(
                    sprintf('tcp://%s:%d', (string) $host, (int) $port),
                    $errno,
                    $errstr,
                    5
                );
                if ($sock === false) {
                    error_log(sprintf(
                        '[mail-recovery] probe TCP %s:%d FAIL errno=%d errstr=%s',
                        (string) $host,
                        (int) $port,
                        $errno,
                        $errstr,
                    ));
                } else {
                    error_log(sprintf(
                        '[mail-recovery] probe TCP %s:%d OK',
                        (string) $host,
                        (int) $port,
                    ));
                    fclose($sock);
                }
            } catch (Throwable $e) {
                error_log('[mail-recovery] probe threw: ' . $e->getMessage());
            }
        }
    }

    /**
     * Restablece la clave del usuario validando un token firmado por
     * PasswordResetTokenService. Devuelve el Usuario actualizado.
     */
    public function confirmar(string $token, string $nuevaContrasena): Usuario
    {
        $payload = $this->tokens->verificar($token);
        $usuario = Usuario::find($payload['uid_local']);

        if (! $usuario) {
            throw new \RuntimeException('La cuenta asociada al enlace ya no existe.');
        }

        // Si por algun motivo el firebase_uid cambio, sincronizamos.
        if (! empty($payload['uid']) && $usuario->firebase_uid !== $payload['uid']) {
            $usuario->firebase_uid = $payload['uid'];
        }

        $this->firebaseAdmin->updatePassword((string) ($usuario->firebase_uid ?? $payload['uid']), $nuevaContrasena);

        $usuario->password_hash = \Illuminate\Support\Facades\Hash::make($nuevaContrasena);
        $usuario->save();

        return $usuario;
    }

    /**
     * @param  array{email?: string|null, usuario?: string|null}  $datos
     */
    private function buscarUsuario(array $datos): ?Usuario
    {
        $email = trim((string) ($datos['email'] ?? ''));
        if ($email !== '') {
            return Usuario::where('email', $email)->first();
        }

        $usuario = trim((string) ($datos['usuario'] ?? ''));
        if ($usuario !== '') {
            return Usuario::where('usuario', $usuario)->first();
        }

        return null;
    }
}