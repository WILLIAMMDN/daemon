import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnDestroy, OnInit, signal , ChangeDetectionStrategy} from '@angular/core';
import { Autenticacion } from '../../servicios/autenticacion';
import { Sesion } from '../../servicios/sesion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-email-verification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification-banner.html',
  styleUrl: './email-verification-banner.scss',
})
export class EmailVerificationBanner implements OnInit, OnDestroy {
  @Input() returnUrl = '/alumno?verificacion=firebase';
  readonly visible = computed(() => {
    const usuario = this.sesion.usuario();

    return Boolean(usuario?.email && usuario.email_verificado === false);
  });

  readonly reenviando = signal(false);
  readonly sincronizando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  private refrescoId: number | null = null;

  constructor(
    private auth: Autenticacion,
    public sesion: Sesion,
  ) {}

  ngOnInit(): void {
    if (globalThis.location?.search.includes('verificacion=firebase')) {
      this.sincronizarFirebaseSilencioso();
    }

    this.refrescarEstado();
    this.refrescoId = window.setInterval(() => this.refrescarEstado(), 12000);
  }

  ngOnDestroy(): void {
    if (this.refrescoId !== null) {
      window.clearInterval(this.refrescoId);
    }
  }

  reenviar(): void {
    if (this.reenviando()) {
      return;
    }

    this.reenviando.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.auth.reenviarVerificacion(this.returnUrl).subscribe({
      next: (respuesta) => {
        this.reenviando.set(false);
        if (respuesta.estado === 'fallo_envio') {
          this.error.set(respuesta.message);
        } else {
          this.mensaje.set(respuesta.message);
        }
        this.refrescarEstado();
      },
      error: (error) => {
        this.reenviando.set(false);
        this.error.set(error.error?.message ?? error.message ?? 'No pudimos reenviar el correo de verificacion.');
      },
    });
  }

  private refrescarEstado(): void {
    if (!this.visible() || this.reenviando() || this.sincronizando()) {
      return;
    }

    this.sincronizando.set(true);

    this.auth.refrescarSesion().subscribe({
      next: () => {
        this.sincronizando.set(false);

        if (!this.visible()) {
          this.mensaje.set('');
          this.error.set('');
        }
      },
      error: () => {
        this.sincronizando.set(false);
      },
    });
  }

  private sincronizarFirebaseSilencioso(): void {
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
        this.refrescarEstado();
      },
      error: () => {
        this.sincronizando.set(false);
        this.refrescarEstado();
      },
    });
  }
}
