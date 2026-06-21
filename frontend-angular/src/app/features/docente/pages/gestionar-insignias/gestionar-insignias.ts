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

    // --- Carga segura de INSIGNIAS ---
    this.docente.insignias().subscribe({
      next: (respuesta: any) => {
        if (Array.isArray(respuesta)) {
          this.insignias.set(respuesta);
        } else if (respuesta && Array.isArray(respuesta.data)) {
          this.insignias.set(respuesta.data);
        } else if (respuesta && Array.isArray(respuesta.insignias)) {
          this.insignias.set(respuesta.insignias);
        } else {
          this.insignias.set([]);
        }
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las insignias.');
        this.insignias.set([]); // Previene error de iteración si falla
        this.cargando.set(false);
      },
    });

    // --- Carga segura de ALUMNOS (para el selector) ---
    this.docente.alumnos().subscribe({
      next: (respuesta: any) => {
        if (Array.isArray(respuesta)) {
          this.alumnos.set(respuesta);
        } else if (respuesta && Array.isArray(respuesta.data)) {
          this.alumnos.set(respuesta.data);
        } else if (respuesta && Array.isArray(respuesta.alumnos)) {
          this.alumnos.set(respuesta.alumnos);
        } else {
          this.alumnos.set([]);
        }
      },
      error: () => {
        // En caso de error al traer alumnos, aseguramos que el Signal sea un array vacío
        this.alumnos.set([]);
      }
    });
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