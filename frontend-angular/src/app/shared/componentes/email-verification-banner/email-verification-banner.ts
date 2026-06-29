import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Autenticacion } from '../../../core/servicios/autenticacion';
import { Sesion } from '../../../core/servicios/sesion';

@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification-banner.html',
  styleUrl: './email-verification-banner.scss',
})
export class EmailVerificationBanner implements OnInit {
  readonly visible = computed(() => {
    const usuario = this.sesion.usuario();

    return Boolean(usuario?.email && usuario.email_verificado === false);
  });

  readonly reenviando = signal(false);
  readonly sincronizando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
  ) {}

  ngOnInit(): void {
    if (globalThis.location?.search.includes('verificacion=firebase')) {
      this.sincronizar();
    }
  }

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
        this.error.set(error.error?.message ?? error.message ?? 'No pudimos reenviar el correo de verificacion.');
      },
    });
  }

  sincronizar(): void {
    if (this.sincronizando() || this.reenviando()) {
      return;
    }

    this.sincronizando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.auth.sincronizarVerificacionFirebase().subscribe({
      next: (respuesta) => {
        this.sincronizando.set(false);
        this.mensaje.set(respuesta.message);
      },
      error: (error) => {
        this.sincronizando.set(false);
        this.error.set(error.error?.message ?? error.message ?? 'Todavia no aparece verificado. Revisa el correo y vuelve a intentarlo.');
      },
    });
  }
}
