import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Autenticacion } from '../../../core/servicios/autenticacion';
import { Sesion } from '../../../core/servicios/sesion';

@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification-banner.html',
  styleUrl: './email-verification-banner.scss',
})
export class EmailVerificationBanner {
  readonly visible = computed(() => {
    const usuario = this.sesion.usuario();

    return Boolean(usuario?.email && usuario.email_verificado === false);
  });

  readonly reenviando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
  ) {}

  reenviar(): void {
    if (this.reenviando()) {
      return;
    }

    this.reenviando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.auth.reenviarVerificacion().subscribe({
      next: (respuesta) => {
        this.reenviando.set(false);
        this.mensaje.set(respuesta.message);
      },
      error: (error) => {
        this.reenviando.set(false);
        this.error.set(error.error?.message ?? 'No pudimos reenviar el correo de verificacion.');
      },
    });
  }
}
