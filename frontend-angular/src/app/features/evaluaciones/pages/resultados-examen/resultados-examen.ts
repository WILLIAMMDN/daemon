import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Evaluacion } from '../../services/evaluacion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resultados-examen',
  imports: [Cargando],
  templateUrl: './resultados-examen.html',
  styleUrl: './resultados-examen.scss',
})
export class ResultadosExamen {
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
