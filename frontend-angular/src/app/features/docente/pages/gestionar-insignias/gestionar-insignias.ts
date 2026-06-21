import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Docente } from '../../services/docente';

@Component({
  selector: 'app-gestionar-insignias',
  imports: [FormsModule],
  templateUrl: './gestionar-insignias.html',
  styleUrl: './gestionar-insignias.scss',
})
export class GestionarInsignias {
  insignias = signal<any[]>([]);
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  nueva = { nombre: '', descripcion: '', imagen: '' };
  asignacion = { id_alumno: null as number | null, id_insignia: null as number | null, asignar: true };

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.docente.insignias().subscribe({
      next: (insignias) => {
        this.insignias.set(insignias as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las insignias.');
        this.cargando.set(false);
      },
    });
    this.docente.alumnos().subscribe({ next: (alumnos) => this.alumnos.set(alumnos as any[]) });
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.crearInsignia(this.nueva).subscribe({
      next: () => {
        this.nueva = { nombre: '', descripcion: '', imagen: '' };
        this.mensaje.set('Insignia creada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la insignia.');
        this.guardando.set(false);
      },
    });
  }

  asignar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.asignarInsignia(this.asignacion).subscribe({
      next: () => {
        this.mensaje.set('Asignacion actualizada.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo asignar la insignia.');
        this.guardando.set(false);
      },
    });
  }
}
