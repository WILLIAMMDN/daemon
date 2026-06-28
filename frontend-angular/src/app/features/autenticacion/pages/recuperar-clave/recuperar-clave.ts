import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'verificando' }
  | { tipo: 'opciones'; email: string; tieneGoogle: boolean; tieneClave: boolean }
  | { tipo: 'recuperacion_enviada'; email: string }
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

  get opcionesActuales(): { email: string; tieneGoogle: boolean; tieneClave: boolean } | null {
    const e = this.estado();
    return e.tipo === 'opciones' ? e : null;
  }

  get emailEnviado(): string {
    const e = this.estado();
    return e.tipo === 'recuperacion_enviada' ? e.email : '';
  }

  constructor(
    private auth: Autenticacion,
    private router: Router,
  ) {}

  verificarCorreo(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    const email = this.email.trim();
    this.estado.set({ tipo: 'verificando' });

    this.auth.metodosInicioSesion(email).subscribe({
      next: (methods) => {
        const tieneGoogle = methods.includes('google.com');
        const tieneClave = methods.includes('password');

        // Si Firebase reporta metodos, mostramos opciones reales.
        // Si no reporta ninguno (raro), igual mostramos opciones por las dudas,
        // porque Firebase puede no devolver metodos incluso si la cuenta existe.
        this.estado.set({
          tipo: 'opciones',
          email,
          tieneGoogle,
          tieneClave,
        });
      },
      error: () => {
        // Firebase rechaza el lookup si la cuenta no existe o por proteccion.
        // Mostramos opciones neutrales: que el usuario intente el camino que prefiera.
        this.estado.set({
          tipo: 'opciones',
          email,
          tieneGoogle: true,
          tieneClave: true,
        });
      },
    });
  }

  recuperarPorClave(): void {
    const estadoActual = this.estado();
    if (estadoActual.tipo !== 'opciones' || !estadoActual.tieneClave) {
      return;
    }

    const email = estadoActual.email;
    this.enviando.set(true);

    this.auth.recuperarPasswordFirebase(email).subscribe({
      next: () => {
        this.enviando.set(false);
        this.estado.set({ tipo: 'recuperacion_enviada', email });
      },
      error: () => {
        this.enviando.set(false);
        this.estado.set({
          tipo: 'recuperacion_enviada',
          email,
        });
      },
    });
  }

  continuarConGoogle(): void {
    const estadoActual = this.estado();
    if (estadoActual.tipo !== 'opciones' || !estadoActual.tieneGoogle) {
      return;
    }

    this.enviando.set(true);
    this.auth.loginGoogleFirebase().subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl('/alumno');
      },
      error: () => {
        this.enviando.set(false);
        // Volvemos a la vista de opciones sin error visible
        // (loginGoogleFirebase ya muestra el error en su propia UI).
      },
    });
  }

  volver(): void {
    this.email = '';
    this.estado.set({ tipo: 'inicial' });
  }
}