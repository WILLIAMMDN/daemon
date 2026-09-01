import { Injectable, computed, inject, signal } from '@angular/core';
import { Alumno } from '../../services/alumno';
import { SesionAprendizajeDto } from '../../models/contexto-alumno.model';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly alumno = inject(Alumno);

  readonly sesiones = signal<SesionAprendizajeDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly sesionesHoy = computed(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    return this.sesiones().filter((s) => s.fecha_inicio.startsWith(hoyStr));
  });

  readonly sesionesFuturas = computed(() => {
    const ahora = new Date().toISOString();
    return this.sesiones().filter((s) => s.fecha_inicio >= ahora);
  });

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 2, 0, 23, 59, 59).toISOString();

    this.alumno.agenda(inicio, fin, true).subscribe({
      next: (resp) => {
        this.sesiones.set(resp.events || []);
        this.cargando.set(false);
      },
      error: () => {
        this.sesiones.set([]);
        this.cargando.set(false);
      },
    });
  }

  asegurarCargado(): void {
    if (!this.sesiones().length && !this.cargando()) {
      this.cargar();
    }
  }
}
