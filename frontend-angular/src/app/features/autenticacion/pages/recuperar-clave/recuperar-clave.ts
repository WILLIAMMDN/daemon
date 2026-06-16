import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

@Component({
  selector: 'app-recuperar-clave',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-clave.html',
  styleUrl: './recuperar-clave.scss',
})
export class RecuperarClave {
  datos = { usuario: '', email: '' };
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');

  constructor(private auth: Autenticacion) {}

  solicitar(): void {
    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.auth.solicitarRecuperacion(this.datos).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.enviando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo registrar la solicitud.');
        this.enviando.set(false);
      },
    });
  }
}
