import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './recuperar-clave.html',
  styleUrl: './recuperar-clave.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecuperarClave implements OnInit {
  datos = { usuario: '', email: '' };
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  googleEmail = signal<string | null>(null);

  constructor(
    private auth: Autenticacion,
    private socialAuth: SocialAuthService,
  ) {}

  ngOnInit(): void {
    this.socialAuth.authState.subscribe((user) => {
      this.googleEmail.set(user?.email ?? null);
    });
  }

  enviarCodigoGoogle(): void {
    const email = this.googleEmail();
    if (!email) {
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.auth.solicitarRecuperacion({ email }).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Código enviado. Revisa tu correo.');
        this.enviando.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'No se pudo solicitar la recuperación.');
        this.enviando.set(false);
      },
    });
  }

  solicitar(form?: NgForm): void {
    const usuario = this.datos.usuario.trim();
    const email = this.datos.email.trim();

    if (form?.invalid || (!usuario && !email)) {
      this.error.set('Ingresa tu usuario o correo electrónico.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.auth.solicitarRecuperacion({ usuario, email }).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Solicitud registrada. Revisa tu correo.');
        this.enviando.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message ?? 'No se pudo registrar la solicitud.');
        this.enviando.set(false);
      },
    });
  }
}
