import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

@Component({
  selector: 'app-registro-docente',
  imports: [FormsModule],
  templateUrl: './registro-docente.html',
  styleUrl: './registro-docente.scss',
})
export class RegistroDocente {
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  datos = {
    nombre_completo: '',
    email: '',
    usuario: '',
    password: '',
    password_confirmation: '',
    rol: 'docente',
    nivel: 'TEENS',
  };

  constructor(private autenticacion: Autenticacion) {}

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.autenticacion.crearUsuario(this.datos).subscribe({
      next: () => {
        this.mensaje.set('Usuario creado.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear el usuario.');
        this.guardando.set(false);
      },
    });
  }
}
