import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faChartLine, faCircleCheck, faRotateRight, faStar, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Evaluacion, ResultadoEvaluacion } from '../../services/evaluacion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resultados-examen',
  imports: [DatePipe, RouterLink, FontAwesomeModule, NzButtonModule, NzTableModule, NzTagModule, EstadoVacio],
  templateUrl: './resultados-examen.html',
  styleUrl: './resultados-examen.scss',
})
export class ResultadosExamen {
  readonly resultados = signal<ResultadoEvaluacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly promedio = computed(() => {
    const resultados = this.resultados();
    return resultados.length ? Math.round(resultados.reduce((total, item) => total + item.puntaje, 0) / resultados.length) : 0;
  });
  readonly mejorPuntaje = computed(() => Math.max(0, ...this.resultados().map((item) => item.puntaje)));
  readonly aprobadas = computed(() => this.resultados().filter((item) => item.puntaje >= 70).length);
  readonly iconos = {
    actualizar: faRotateRight,
    check: faCircleCheck,
    flecha: faArrowRight,
    progreso: faChartLine,
    problema: faTriangleExclamation,
    estrella: faStar,
  };

  constructor(private readonly evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.resultados().subscribe({
      next: (resultados) => {
        this.resultados.set(resultados);
        this.cargando.set(false);
      },
      error: (problema: unknown) => {
        this.error.set(this.mensajeError(problema));
        this.cargando.set(false);
      },
    });
  }

  estadoLabel(resultado: ResultadoEvaluacion): string {
    return resultado.puntaje >= 70 ? 'Aprobada' : 'Sigue practicando';
  }

  private mensajeError(problema: unknown): string {
    if (problema instanceof HttpErrorResponse) return problema.error?.message ?? 'No pudimos cargar tus resultados.';
    return 'No pudimos cargar tus resultados.';
  }
}
