<?php

namespace App\Services\Auth;

use App\Mail\RecuperarClaveMail;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class RecuperacionClaveService
{
    public function __construct(private readonly FirebasePasswordResetLinkService $firebaseLinks) {}

    public function solicitar(array $datos): void
    {
        $usuario = $this->buscarUsuario($datos);

        if (! $usuario?->email) {
            return;
        }

        try {
            $link = $this->firebaseLinks->crear($usuario->email);
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
