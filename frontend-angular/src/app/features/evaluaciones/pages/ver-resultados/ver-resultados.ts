import { Component, signal } from '@angular/core';
import { Evaluacion } from '../../services/evaluacion';

@Component({
  selector: 'app-ver-resultados',
  imports: [],
  templateUrl: './ver-resultados.html',
  styleUrl: './ver-resultados.scss',
})
export class VerResultados {
  resultados = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.resultados().subscribe({
      next: (resultados) => {
        this.resultados.set(resultados as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los resultados.');
        this.cargando.set(false);
      },
    });
  }
}
