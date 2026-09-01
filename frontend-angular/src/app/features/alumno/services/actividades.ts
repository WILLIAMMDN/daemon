import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Api } from '../../../core/servicios/api';
import { EstadoCompetencia } from '../../../core/modelos/dto';
import { EvaluacionActiva } from '../../evaluaciones/services/evaluacion';
import { MisionAlumno } from '../../misiones/services/mision';

export type EstadoActividad = 'porHacer' | 'enRevision' | 'requiereCorreccion' | 'completada';

export interface ActividadAlumno {
  id: string;
  tipo: 'mision' | 'evaluacion';
  titulo: string;
  detalle: string | null;
  ruta: string;
  estado: EstadoActividad;
  estadoLabel: string;
  /** Recompensa real declarada por la actividad; `null` cuando no aplica. */
  recompensa: number | null;
  fecha: string | null;
}

const ETIQUETA_ESTADO: Record<EstadoActividad, string> = {
  porHacer: 'Por entregar',
  enRevision: 'En revisión',
  requiereCorreccion: 'Requiere corrección',
  completada: 'Completada',
};

/**
 * Actividades reales del estudiante: misiones (`/misiones`), evaluaciones
 * activas (`/evaluaciones/activas`) y la competencia en vivo
 * (`/competencia/estado`).
 *
 * Es la fuente compartida de Aprender › Actividades, de Agenda y del bloque de
 * eventos de Comunidad. No inventa fechas ni entregas: la plataforma todavía no
 * expone vencimientos ni sesiones programadas.
 */
@Injectable({ providedIn: 'root' })
export class Actividades {
  private readonly api = inject(Api);

  readonly misiones = signal<MisionAlumno[]>([]);
  readonly evaluaciones = signal<EvaluacionActiva[]>([]);
  readonly competencia = signal<EstadoCompetencia | null>(null);

  readonly cargando = signal(false);
  readonly cargado = signal(false);
  readonly error = signal(false);

  readonly actividades = computed<ActividadAlumno[]>(() => [
    ...this.misiones().map((mision) => this.desdeMision(mision)),
    ...this.evaluaciones().map((evaluacion) => this.desdeEvaluacion(evaluacion)),
  ]);

  readonly pendientes = computed(() =>
    this.actividades().filter((actividad) => actividad.estado === 'porHacer' || actividad.estado === 'requiereCorreccion'),
  );
  readonly enRevision = computed(() => this.actividades().filter((actividad) => actividad.estado === 'enRevision'));
  readonly completadas = computed(() => this.actividades().filter((actividad) => actividad.estado === 'completada'));

  /** La ronda en vivo sólo cuenta como evento cuando realmente está abierta. */
  readonly eventoEnVivo = computed(() => {
    const estado = this.competencia();
    return estado && estado.ronda?.estado === 'votacion' ? estado : null;
  });

  asegurarCargado(): void {
    if (!this.cargado() && !this.cargando()) this.cargar();
  }

  cargar(fresh = false): void {
    this.cargando.set(true);
    this.error.set(false);

    forkJoin({
      misiones: this.api.get<MisionAlumno[]>('/misiones', { fresh }).pipe(catchError(() => of(null))),
      evaluaciones: this.api.get<EvaluacionActiva[]>('/evaluaciones/activas', { fresh }).pipe(catchError(() => of(null))),
      competencia: this.api.get<EstadoCompetencia>('/competencia/estado', { fresh }).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((respuesta) => {
        this.misiones.set(respuesta.misiones ?? []);
        this.evaluaciones.set(respuesta.evaluaciones ?? []);
        this.competencia.set(respuesta.competencia);
        this.error.set(respuesta.misiones === null && respuesta.evaluaciones === null && respuesta.competencia === null);
        this.cargado.set(true);
      });
  }

  private desdeMision(mision: MisionAlumno): ActividadAlumno {
    const entrega = mision.entrega ?? null;
    const estado: EstadoActividad = !entrega
      ? 'porHacer'
      : entrega.estado === 'aprobado'
        ? 'completada'
        : entrega.estado === 'rechazado'
          ? 'requiereCorreccion'
          : 'enRevision';

    return {
      id: `mision-${mision.id}`,
      tipo: 'mision',
      titulo: mision.titulo,
      detalle: mision.descripcion ?? null,
      ruta: `/alumno/aprender/misiones/${mision.id}`,
      estado,
      estadoLabel: ETIQUETA_ESTADO[estado],
      recompensa: mision.recompensa ?? null,
      fecha: entrega?.fecha_entrega ?? mision.fecha_creacion ?? null,
    };
  }

  private desdeEvaluacion(evaluacion: EvaluacionActiva): ActividadAlumno {
    return {
      id: `evaluacion-${evaluacion.id}`,
      tipo: 'evaluacion',
      titulo: evaluacion.titulo,
      detalle: `${evaluacion.preguntas?.length ?? 0} preguntas · nivel ${evaluacion.nivel}`,
      ruta: '/alumno/aprender/evaluaciones',
      estado: 'porHacer',
      estadoLabel: ETIQUETA_ESTADO['porHacer'],
      recompensa: null,
      fecha: evaluacion.fecha_creacion ?? null,
    };
  }
}
