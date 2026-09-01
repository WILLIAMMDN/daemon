import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { ListaActividades } from '../../../componentes/lista-actividades/lista-actividades';

/** Entregas — el estado real de todo lo que el estudiante ya envió. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-entregas',
  imports: [RouterLink, NzButtonModule, NzSkeletonModule, ArcSection, EstadoVacio, ListaActividades],
  templateUrl: './entregas.html',
  styleUrl: './entregas.scss',
})
export class Entregas {
  readonly actividades = inject(Actividades);

  readonly devueltas = computed(() =>
    this.actividades.actividades().filter((actividad) => actividad.estado === 'requiereCorreccion'),
  );
  readonly sinEntregas = computed(
    () =>
      !this.actividades.enRevision().length &&
      !this.actividades.completadas().length &&
      !this.devueltas().length,
  );

  constructor() {
    this.actividades.asegurarCargado();
  }
}
