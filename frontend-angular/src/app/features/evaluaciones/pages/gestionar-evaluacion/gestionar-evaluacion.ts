import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Evaluacion } from '../../services/evaluacion';

@Component({
  selector: 'app-gestionar-evaluacion',
  imports: [FormsModule],
  templateUrl: './gestionar-evaluacion.html',
  styleUrl: './gestionar-evaluacion.scss',
})
export class GestionarEvaluacion {
  evaluaciones = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  nueva = { titulo: '', nivel: 'TEENS', estado: 'borrador' };
  pregunta = { examen_id: null as number | null, enunciado: '', tipo: 'opcion_multiple', opciones: '', respuesta_correcta: '' };

  constructor(private evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.listarDocente().subscribe({
      next: (evaluaciones) => {
        this.evaluaciones.set(evaluaciones as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las evaluaciones.');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.evaluacion.crear(this.nueva).subscribe({
      next: () => {
        this.nueva = { titulo: '', nivel: 'TEENS', estado: 'borrador' };
        this.mensaje.set('Evaluacion creada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la evaluacion.');
        this.guardando.set(false);
      },
    });
  }

  agregarPregunta(): void {
    const examen = this.evaluaciones().find((item) => Number(item.id) === Number(this.pregunta.examen_id));
    if (!examen) return;
    const nuevaPregunta = {
      enunciado: this.pregunta.enunciado,
      tipo: this.pregunta.tipo,
      opciones: this.pregunta.opciones.split(',').map((opcion) => opcion.trim()).filter(Boolean),
      respuesta_correcta: this.pregunta.respuesta_correcta,
    };
    const preguntas = [...(examen.preguntas ?? []).map((item: any) => ({
      enunciado: item.enunciado,
      tipo: item.tipo,
      opciones: item.opciones ?? [],
      respuesta_correcta: item.respuesta_correcta,
    })), nuevaPregunta];

    this.guardando.set(true);
    this.evaluacion.guardarPreguntas(examen.id, preguntas).subscribe({
      next: () => {
        this.pregunta = { examen_id: examen.id, enunciado: '', tipo: 'opcion_multiple', opciones: '', respuesta_correcta: '' };
        this.mensaje.set('Pregunta agregada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo guardar la pregunta.');
        this.guardando.set(false);
      },
    });
  }
}
