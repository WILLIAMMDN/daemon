import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { ListaActividades } from '../../../componentes/lista-actividades/lista-actividades';

/** Próximamente — trabajo asignado que todavía no entregaste. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-proximamente',
  imports: [RouterLink, NzAlertModule, NzButtonModule, NzSkeletonModule, ArcSection, EstadoVacio, ListaActividades],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.scss',
})
export class Proximamente {
  readonly actividades = inject(Actividades);

  constructor() {
    this.actividades.asegurarCargado();
  }
}
