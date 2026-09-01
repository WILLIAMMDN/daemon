import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';
import { Actividades } from '../../../services/actividades';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-agenda',
  imports: [RouterOutlet, ArcArea],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class Agenda {
  private readonly actividades = inject(Actividades);

  readonly items = computed<ArcNavItem[]>(() => [
    { etiqueta: 'Hoy', ruta: 'hoy' },
    { etiqueta: 'Próximamente', ruta: 'proximamente', contador: this.actividades.pendientes().length || null },
    { etiqueta: 'Entregas', ruta: 'entregas', contador: this.actividades.enRevision().length || null },
  ]);

  constructor() {
    this.actividades.asegurarCargado();
  }
}
