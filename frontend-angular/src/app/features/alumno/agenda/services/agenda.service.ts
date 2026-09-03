import { Injectable, computed, inject, signal } from '@angular/core';
import { Alumno } from '../../services/alumno';
import { SesionAprendizajeDto } from '../../models/contexto-alumno.model';

/**
 * Agenda del Alumno.
 *
 * Fuente única: `GET /alumno/agenda`. No existe ningún calendario paralelo en
 * el frontend: lo que el docente publica en la cohorte es lo que se ve aquí.
 */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly alumno = inject(Alumno);

  readonly sesiones = signal<SesionAprendizajeDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly cargado = signal(false);

  /** Fin real de la sesión: `endsAt` cuando existe, si no el propio inicio. */
  private readonly finDe = (sesion: SesionAprendizajeDto): number =>
    new Date(sesion.endsAt ?? sesion.startsAt).getTime();

  readonly sesionesHoy = computed(() => {
    const ahora = new Date();
    return this.sesiones().filter((sesion) => {
      const inicio = new Date(sesion.startsAt);
      return (
        sesion.status !== 'cancelled' &&
        inicio.getFullYear() === ahora.getFullYear() &&
        inicio.getMonth() === ahora.getMonth() &&
        inicio.getDate() === ahora.getDate()
      );
    });
  });

  readonly sesionesFuturas = computed(() => {
    const ahora = Date.now();
    return this.sesiones()
      .filter((sesion) => sesion.status === 'scheduled' && this.finDe(sesion) >= ahora)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  });

  readonly proximaSesion = computed(() => this.sesionesFuturas()[0] ?? null);

  /** Sesiones futuras que el docente canceló: el alumnado debe enterarse. */
  readonly sesionesCanceladas = computed(() => {
    const ahora = Date.now();
    return this.sesiones()
      .filter((sesion) => sesion.status === 'cancelled' && this.finDe(sesion) >= ahora)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  });

  readonly sesionesPasadas = computed(() => {
    const ahora = Date.now();
    return this.sesiones()
      .filter((sesion) => this.finDe(sesion) < ahora)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  });

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 2, 0, 23, 59, 59).toISOString();

    this.alumno.agenda(inicio, fin, true).subscribe({
      next: (resp) => {
        this.sesiones.set(resp.events ?? []);
        this.cargando.set(false);
        this.cargado.set(true);
      },
      error: () => {
        this.sesiones.set([]);
        this.error.set('No pudimos cargar tus sesiones en vivo.');
        this.cargando.set(false);
        this.cargado.set(true);
      },
    });
  }

  asegurarCargado(): void {
    if (!this.cargado() && !this.cargando()) {
      this.cargar();
    }
  }
}
