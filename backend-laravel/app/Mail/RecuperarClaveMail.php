<?php

namespace App\Mail;

use App\Models\Usuario;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecuperarClaveMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Usuario $usuario,
        public readonly string $link,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Restablece tu clave de DAEMON');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.recuperar-clave',
            text: 'emails.auth.recuperar-clave-text',
        );
    }
}
