import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'enviado'; email: string }
  | { tipo: 'error'; mensaje: string };

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-clave.html',
  styleUrl: './recuperar-clave.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecuperarClave {
  email = '';
  estado = signal<Estado>({ tipo: 'inicial' });
  enviando = signal(false);

  get emailEnviado(): string {
    const estado = this.estado();

    return estado.tipo === 'enviado' ? estado.email : '';
  }

  get mensajeError(): string {
    const estado = this.estado();

    return estado.tipo === 'error' ? estado.mensaje : '';
  }

  constructor(
    private auth: Autenticacion,
    private router: Router,
  ) {}

  solicitar(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const email = this.email.trim();
    this.enviando.set(true);
    this.estado.set({ tipo: 'inicial' });

    this.auth.solicitarRecuperacion({ email }).subscribe({
      next: () => this.marcarComoEnviado(email),
      error: () => this.marcarComoEnviado(email),
    });
  }

  continuarConGoogle(): void {
    this.enviando.set(true);

    this.auth.loginGoogleFirebase().subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl('/alumno');
      },
      error: (error) => {
        this.enviando.set(false);
        this.estado.set({
          tipo: 'error',
          mensaje: error?.error?.message ?? error?.message ?? 'No se pudo iniciar sesion con Google.',
        });
      },
    });
  }

  volver(): void {
    this.email = '';
    this.estado.set({ tipo: 'inicial' });
  }

  private marcarComoEnviado(email: string): void {
    this.enviando.set(false);
    this.estado.set({ tipo: 'enviado', email });
  }
}
