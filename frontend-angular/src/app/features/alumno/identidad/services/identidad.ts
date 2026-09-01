import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Api } from '../../../../core/servicios/api';
import { PanelAlumnoDto } from '../../models/panel-alumno.model';

/**
 * Estado de identidad y progresión del jugador (DAEMON Pulse).
 *
 * Consume `/alumno/panel`, que es el contrato real donde viven el nivel, la XP,
 * la racha, las insignias y la posición en el ranking. El Mastery académico NO
 * se calcula aquí: vive en Aprender, sobre los objetivos de aprendizaje.
 */
@Injectable({ providedIn: 'root' })
export class IdentidadAlumno {
  private readonly api = inject(Api);

  readonly panel = signal<PanelAlumnoDto | null>(null);
  readonly cargando = signal(false);
  readonly error = signal(false);
  readonly cargado = computed(() => this.panel() !== null);

  readonly progreso = computed(() => this.panel()?.progreso_nivel ?? null);

  asegurarCargado(): void {
    if (this.panel() === null && !this.cargando()) this.cargar();
  }

  cargar(fresh = false): void {
    this.cargando.set(true);
    this.error.set(false);

    this.api
      .get<PanelAlumnoDto>('/alumno/panel', { fresh })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (panel) => this.panel.set(panel),
        error: () => this.error.set(true),
      });
  }
}
