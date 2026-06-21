import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Competencia } from '../../services/competencia';
import { Docente } from '../../../docente/services/docente';

@Component({
  selector: 'app-competencia-control',
  imports: [FormsModule],
  templateUrl: './competencia-control.html',
  styleUrl: './competencia-control.scss',
})
export class CompetenciaControl {
  estado = signal<any | null>(null);
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  control = { accion: 'candidato', id_alumno: null as number | null, duracion: 60, puntos: null as number | null };

  constructor(private competencia: Competencia, private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.competencia.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la competencia.');
        this.cargando.set(false);
      },
    });
    this.docente.alumnos().subscribe({ next: (alumnos) => this.alumnos.set(alumnos as any[]) });
  }

  ejecutar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.competencia.controlar(this.control).subscribe({
      next: () => {
        this.mensaje.set('Ronda actualizada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo actualizar la ronda.');
        this.guardando.set(false);
      },
    });
  }
}
