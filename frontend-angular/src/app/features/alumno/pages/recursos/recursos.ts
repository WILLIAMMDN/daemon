import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Api } from '../../../../core/servicios/api';

interface ProgresoLeccion {
  estado: 'notStarted' | 'inProgress' | 'completed';
  porcentaje: number;
}

interface Leccion {
  id: number;
  titulo: string;
  resumen?: string | null;
  duracion_minutos?: number | null;
  progresos: ProgresoLeccion[];
}

interface Unidad {
  id: number;
  titulo: string;
  descripcion?: string | null;
  lecciones: Leccion[];
}

interface Curso {
  id: number;
  titulo: string;
  descripcion?: string | null;
  nivel?: string | null;
  unidades: Unidad[];
}

interface AprendizajeResponse {
  cursos: Curso[];
  resumen: { cursos: number; lecciones: number; completadas: number; porcentaje: number };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recursos',
  imports: [],
  templateUrl: './recursos.html',
  styleUrl: './recursos.scss',
})
export class Recursos {
  private readonly api = inject(Api);

  readonly datos = signal<AprendizajeResponse | null>(null);
  readonly cargando = signal(true);
  readonly actualizando = signal<number | null>(null);
  readonly error = signal('');

  constructor() {
    this.cargar();
  }

  cargar(fresh = false): void {
    this.cargando.set(!this.datos());
    this.error.set('');
    this.api.get<AprendizajeResponse>('/alumno/aprendizaje', { fresh })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (datos) => this.datos.set(datos),
        error: () => this.error.set('No pudimos cargar tus cursos. Revisa tu conexión e inténtalo nuevamente.'),
      });
  }

  progreso(leccion: Leccion): ProgresoLeccion {
    return leccion.progresos[0] ?? { estado: 'notStarted', porcentaje: 0 };
  }

  completar(leccion: Leccion): void {
    if (this.progreso(leccion).estado === 'completed' || this.actualizando() !== null) {
      return;
    }
    this.actualizando.set(leccion.id);
    this.api.put<ProgresoLeccion>(`/alumno/aprendizaje/lecciones/${leccion.id}/progreso`, {
      estado: 'completed',
      porcentaje: 100,
    }).pipe(finalize(() => this.actualizando.set(null))).subscribe({
      next: (progreso) => {
        const datos = this.datos();
        if (!datos) return;
        const cursos = datos.cursos.map((curso) => ({
          ...curso,
          unidades: curso.unidades.map((unidad) => ({
            ...unidad,
            lecciones: unidad.lecciones.map((item) => item.id === leccion.id ? { ...item, progresos: [progreso] } : item),
          })),
        }));
        const lecciones = cursos.flatMap((curso) => curso.unidades).flatMap((unidad) => unidad.lecciones);
        const completadas = lecciones.filter((item) => this.progreso(item).estado === 'completed').length;
        this.datos.set({
          cursos,
          resumen: {
            ...datos.resumen,
            completadas,
            porcentaje: lecciones.length ? Math.round(completadas * 100 / lecciones.length) : 0,
          },
        });
        this.api.post('/telemetria/eventos', {
          nombre: 'lesson_completed',
          propiedades: { lesson_id: leccion.id, module: 'cursos' },
        }).subscribe({ error: () => undefined });
      },
      error: () => this.error.set('No se pudo guardar el avance. Tu contenido permanece disponible.'),
    });
  }
}
