import { Component, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmButtonImports],
  templateUrl: './recuperar-clave.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './recuperar-clave.scss',
})
export class RecuperarClave implements OnInit {
  datos = { usuario: '', email: '' };
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  googleEmail = signal<string | null>(null);

  constructor(private auth: Autenticacion, private socialAuth: SocialAuthService, private router: Router) {}

  ngOnInit(): void {
    // En vista de recuperación NO auto-logueamos; si detectamos una cuenta Google
    // ofrecemos enviar el código al email asociado.
    this.socialAuth.authState.subscribe((user) => {
      this.googleEmail.set(user?.email ?? null);
    });
  }

  enviarCodigoGoogle(): void {
    const email = this.googleEmail();
    if (!email) return;

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.auth.solicitarRecuperacion({ email }).subscribe({
      next: (r) => {
        this.mensaje.set(r.message ?? 'Código enviado. Revisa tu correo.');
        this.enviando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo solicitar la recuperación.');
        this.enviando.set(false);
      }
    });
  }

  solicitar(form?: NgForm): void {
    if (form && form.invalid) {
      this.error.set('Por favor completa el campo de usuario o correo.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.auth.solicitarRecuperacion(this.datos).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Solicitud registrada. Revisa tu correo.');
        this.enviando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo registrar la solicitud.');
        this.enviando.set(false);
      },
    });
  }
}
