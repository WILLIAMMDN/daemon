import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OPCIONES_NIVEL_ALUMNO } from '../../../../core/dominio/nivel-alumno';
import { Autenticacion } from '../../../../core/servicios/autenticacion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-registro-docente',
  imports: [FormsModule],
  templateUrl: './registro-docente.html',
  styleUrl: './registro-docente.scss',
})
export class RegistroDocente {
  readonly nivelesAlumno = OPCIONES_NIVEL_ALUMNO;
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
