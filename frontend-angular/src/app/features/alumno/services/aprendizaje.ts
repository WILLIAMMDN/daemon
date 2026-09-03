import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { Api, ApiError } from '../../../core/servicios/api';
import {
  AprendizajeResponse,
  CursoVista,
  ProgresoLeccion,
  construirCursoVista,
} from '../models/aprendizaje.model';
import {
  ExperienciaAprendizajeDto,
  HomeContextResponse,
  LearningContextResponse,
  LearningMapResponse,
  RutasAlumnoResponse,
  SiguienteItemResponse,
} from '../models/contexto-alumno.model';

export type MotivoErrorAprendizaje = 'offline' | 'timeout' | 'permission' | 'generic';

/**
 * Estado compartido de la experiencia de aprendizaje del estudiante.
 *
 * Vive en `root` para que Mis aprendizajes, Explorar, Rutas y el espacio de un
 * curso consuman la misma respuesta ya cacheada por `Api` en lugar de repetir
 * la petición y volver a derivar el progreso cada uno por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class Aprendizaje {
  private readonly api = inject(Api);

  private readonly datos = signal<AprendizajeResponse | null>(null);
  readonly learningContext = signal<LearningContextResponse | null>(null);
  readonly homeContext = signal<HomeContextResponse | null>(null);
  readonly mapa = signal<LearningMapResponse | null>(null);

  readonly cargando = signal(false);
  readonly refrescando = signal(false);
  readonly error = signal<MotivoErrorAprendizaje | null>(null);

  readonly resumen = computed(() => this.datos()?.resumen ?? null);
  readonly cursos = computed<CursoVista[]>(() => (this.datos()?.cursos ?? []).map(construirCursoVista));
  readonly cargado = computed(() => this.datos() !== null);

  readonly enProgreso = computed(() => this.cursos().filter((curso) => curso.estado === 'inProgress'));
  readonly porIniciar = computed(() => this.cursos().filter((curso) => curso.estado === 'notStarted'));
  readonly completados = computed(() => this.cursos().filter((curso) => curso.estado === 'completed'));

  /** Progreso académico por objetivos de aprendizaje cubiertos por lecciones completadas. */
  readonly objetivosProgreso = computed(() => {
    const cursos = this.cursos();
    const totales = cursos.reduce((total, curso) => total + curso.objetivosTotales, 0);
    const logrados = cursos.reduce((total, curso) => total + curso.objetivosLogrados, 0);
    return { totales, logrados, porcentaje: totales ? Math.round((logrados * 100) / totales) : 0 };
  });

  /** Alias para compatibilidad de vistas previas. */
  readonly mastery = this.objetivosProgreso;

  curso(id: number): CursoVista | null {
    return this.cursos().find((curso) => curso.id === id) ?? null;
  }

  /** Carga la respuesta si aún no está en memoria. Es idempotente. */
  asegurarCargado(): void {
    if (this.datos() === null && !this.cargando()) this.cargar();
  }

  cargar(fresh = false): void {
    const conservaDatos = this.datos() !== null;
    this.cargando.set(!conservaDatos);
    this.refrescando.set(conservaDatos);
    this.error.set(null);

    this.api
      .get<AprendizajeResponse>('/alumno/aprendizaje', { fresh })
      .pipe(
        finalize(() => {
          this.cargando.set(false);
          this.refrescando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.datos.set(respuesta);
          this.error.set(null);
        },
        error: (problema: unknown) => this.error.set(this.clasificar(problema)),
      });

    this.api.get<LearningContextResponse>('/alumno/learning-context', { fresh }).subscribe({
      next: (ctx) => this.learningContext.set(ctx),
      error: () => this.learningContext.set(null),
    });

    this.api.get<HomeContextResponse>('/alumno/home-context', { fresh }).subscribe({
      next: (ctx) => this.homeContext.set(ctx),
      error: () => this.homeContext.set(null),
    });

    this.cargarMapa(fresh).subscribe({
      next: () => undefined,
      error: () => this.mapa.set(null),
    });
  }

  cargarMapa(fresh = false) {
    return this.api
      .get<LearningMapResponse>('/alumno/aprender/mapa', { fresh })
      .pipe(tap((mapa) => this.mapa.set(mapa)));
  }

  /** Marca una lección como completada y refleja el nuevo progreso en memoria. */
  completarLeccion(leccionId: number) {
    return this.api.put<ProgresoLeccion>(`/alumno/aprendizaje/lecciones/${leccionId}/progreso`, {
      estado: 'completed',
      porcentaje: 100,
    });
  }

  aplicarProgreso(leccionId: number, progreso: ProgresoLeccion): void {
    const actual = this.datos();
    if (!actual) return;

    const cursos = actual.cursos.map((curso) => ({
      ...curso,
      unidades: curso.unidades.map((unidad) => ({
        ...unidad,
        lecciones: unidad.lecciones.map((leccion) =>
          leccion.id === leccionId ? { ...leccion, progresos: [progreso] } : leccion,
        ),
      })),
    }));

    const lecciones = cursos.flatMap((curso) => curso.unidades).flatMap((unidad) => unidad.lecciones);
    const completadas = lecciones.filter((leccion) => leccion.progresos[0]?.estado === 'completed').length;

    this.datos.set({
      cursos,
      resumen: {
        ...actual.resumen,
        completadas,
        porcentaje: lecciones.length ? Math.round((completadas * 100) / lecciones.length) : 0,
      },
    });
  }

  rutasDisponibles() {
    return this.api.get<RutasAlumnoResponse>('/alumno/rutas');
  }

  siguienteItem() {
    return this.api.get<SiguienteItemResponse>('/alumno/aprender/siguiente');
  }

  iniciarIntento(experienciaId: number, idempotencyKey: string) {
    return this.api.post<{ id: number; uuid: string; numero: number; estado: string }>(
      `/alumno/aprender/experiencias/${experienciaId}/intentos`,
      { idempotency_key: idempotencyKey },
    );
  }

  entregarEvidencia(intentoId: number, datos: { tipo: string; id_objetivo?: number | null; referencia?: string; metadatos?: Record<string, unknown> }) {
    return this.api.post<{ id: number; estado: string; evidencias: unknown[] }>(
      `/alumno/aprender/intentos/${intentoId}/evidencias`,
      datos,
    );
  }

  experiencia(id: number): ExperienciaAprendizajeDto | null {
    const mapa = this.mapa();
    if (!mapa) return null;
    for (const hito of mapa.milestones) {
      const exp = hito.experiences.find((e) => e.id === id);
      if (exp) return exp;
    }
    return null;
  }

  private clasificar(problema: unknown): MotivoErrorAprendizaje {
    if (problema instanceof ApiError) return problema.kind === 'offline' ? 'offline' : 'timeout';
    if (problema instanceof HttpErrorResponse && [401, 403].includes(problema.status)) return 'permission';
    return 'generic';
  }
}
