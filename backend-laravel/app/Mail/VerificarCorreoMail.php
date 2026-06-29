<?php

namespace App\Mail;

use App\Models\Usuario;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email transaccional de "Confirma tu correo electronico". Se envia tras
 * el registro clasico (email + clave) para que el usuario valide que
 * controla la direccion. El link apunta al frontend y transporta un
 * JWT firmado por el backend.
 *
 * Las cuentas que entran por Google NO disparan este correo: Google ya
 * verifico el email, asi que marcamos email_verified_at en el login
 * inicial sin necesidad de mandar nada.
 */
class VerificarCorreoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Usuario $usuario,
        public readonly string $link,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirma tu correo de DAEMON');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.verificar-correo',
            text: 'emails.auth.verificar-correo-text',
        );
    }
}