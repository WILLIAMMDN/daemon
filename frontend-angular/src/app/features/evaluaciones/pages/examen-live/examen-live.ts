import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCheck, faClipboardCheck, faClock, faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Evaluacion, EvaluacionActiva, PreguntaEvaluacion } from '../../services/evaluacion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-examen-live',
  imports: [FormsModule, RouterLink, FontAwesomeModule, NzAlertModule, NzButtonModule, NzTagModule, EstadoVacio],
  templateUrl: './examen-live.html',
  styleUrl: './examen-live.scss',
})
export class ExamenLive {
  readonly examenes = signal<EvaluacionActiva[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal<number | null>(null);
  readonly mensaje = signal('');
  readonly errorCarga = signal('');
  readonly errorEnvio = signal('');
  readonly respuestas: Record<number, string> = {};
  readonly iconos = {
    actualizar: faRotateRight,
    check: faCheck,
    evaluacion: faClipboardCheck,
    flecha: faArrowRight,
    reloj: faClock,
    problema: faTriangleExclamation,
  };

  constructor(private readonly evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.evaluacion.activas().subscribe({
      next: (examenes) => {
        this.examenes.set(examenes);
        this.cargando.set(false);
      },
      error: (problema: unknown) => {
        this.errorCarga.set(this.mensajeError(problema, 'No pudimos cargar las evaluaciones.'));
        this.cargando.set(false);
      },
    });
  }

  responder(examen: EvaluacionActiva): void {
    if (!this.puedeResponder(examen) || this.enviando() !== null) return;

    const respuestas = Object.fromEntries(
      examen.preguntas.map((pregunta) => [String(pregunta.id), this.respuestas[pregunta.id].trim()]),
    );

    this.enviando.set(examen.id);
    this.mensaje.set('');
    this.errorEnvio.set('');
    this.evaluacion.responder(examen.id, respuestas)
      .pipe(finalize(() => this.enviando.set(null)))
      .subscribe({
        next: (resultado) => {
          this.mensaje.set(`Evaluación enviada: ${resultado.correctas} de ${resultado.total} respuestas correctas.`);
        },
        error: (problema: unknown) => {
          this.errorEnvio.set(this.mensajeError(problema, 'No pudimos enviar la evaluación. Tus respuestas siguen disponibles.'));
        },
      });
  }

  actualizarRespuesta(pregunta: PreguntaEvaluacion, valor: string): void {
    this.respuestas[pregunta.id] = valor;
  }

  respondidas(examen: EvaluacionActiva): number {
    return examen.preguntas.filter((pregunta) => Boolean(this.respuestas[pregunta.id]?.trim())).length;
  }

  puedeResponder(examen: EvaluacionActiva): boolean {
    return examen.preguntas.length > 0 && this.respondidas(examen) === examen.preguntas.length;
  }

  private mensajeError(problema: unknown, fallback: string): string {
    if (problema instanceof HttpErrorResponse) return problema.error?.message ?? fallback;
    return fallback;
  }
}
