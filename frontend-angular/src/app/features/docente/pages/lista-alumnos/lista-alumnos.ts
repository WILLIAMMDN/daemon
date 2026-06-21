import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Docente } from '../../services/docente';

@Component({
  selector: 'app-lista-alumnos',
  imports: [FormsModule],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss',
})
export class ListaAlumnos {
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  ajuste = { id_alumno: null as number | null, cantidad: 0, motivo: '' };

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.docente.alumnos().subscribe({
      next: (alumnos) => {
        this.alumnos.set(alumnos as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los alumnos.');
        this.cargando.set(false);
      },
    });
  }

  asignarTokens(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.asignarTokens(this.ajuste).subscribe({
      next: () => {
        this.mensaje.set('Tokens actualizados.');
        this.ajuste = { id_alumno: null, cantidad: 0, motivo: '' };
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron actualizar los tokens.');
        this.guardando.set(false);
      },
    });
  }
}
