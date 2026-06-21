import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Evaluacion } from '../../services/evaluacion';

@Component({
  selector: 'app-examen-live',
  imports: [FormsModule],
  templateUrl: './examen-live.html',
  styleUrl: './examen-live.scss',
})
export class ExamenLive {
  examenes = signal<any[]>([]);
  cargando = signal(true);
  enviando = signal<number | null>(null);
  mensaje = signal('');
  error = signal('');
  respuestas: Record<string, string> = {};

  constructor(private evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.activas().subscribe({
      next: (examenes) => {
        this.examenes.set(examenes as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las evaluaciones.');
        this.cargando.set(false);
      },
    });
  }

  responder(examen: any): void {
    const respuestas = Object.fromEntries((examen.preguntas ?? []).map((pregunta: any) => [pregunta.id, this.respuestas[pregunta.id] ?? '']));
    this.enviando.set(examen.id);
    this.mensaje.set('');
    this.error.set('');
    this.evaluacion.responder(examen.id, respuestas).subscribe({
      next: (resultado: any) => {
        this.mensaje.set(`Resultado enviado: ${resultado.correctas}/${resultado.total} correctas.`);
        this.enviando.set(null);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo enviar la evaluacion.');
        this.enviando.set(null);
      },
    });
  }
}
