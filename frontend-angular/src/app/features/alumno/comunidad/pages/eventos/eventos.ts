import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';

/**
 * Eventos — la competencia en vivo, que es el único evento con estado real que
 * la plataforma expone hoy (`/competencia/estado`). No se listan eventos
 * futuros porque no existe un calendario que los publique.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-eventos',
  imports: [RouterLink, NzButtonModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class Eventos {
  readonly actividades = inject(Actividades);

  constructor() {
    this.actividades.asegurarCargado();
  }
}
