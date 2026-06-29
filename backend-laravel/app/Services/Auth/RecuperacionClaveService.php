<?php

namespace App\Services\Auth;

use App\Mail\RecuperarClaveMail;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;
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
            Mail::to($usuario->email)->send(new RecuperarClaveMail($usuario, $link));
        } catch (Throwable $exception) {
            Log::warning('No se pudo enviar recuperacion de clave.', [
                'usuario_id' => $usuario->id,
                'email_hash' => sha1((string) $usuario->email),
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
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