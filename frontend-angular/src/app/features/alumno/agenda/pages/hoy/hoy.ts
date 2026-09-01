import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { ListaActividades } from '../../../componentes/lista-actividades/lista-actividades';
import { AgendaService } from '../../services/agenda.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hoy',
  imports: [
    DatePipe,
    UpperCasePipe,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzSkeletonModule,
    NzTagModule,
    ArcSection,
    EstadoVacio,
    ListaActividades,
  ],
  templateUrl: './hoy.html',
  styleUrl: './hoy.scss',
})
export class Hoy {
  readonly actividades = inject(Actividades);
  readonly agendaService = inject(AgendaService);

  readonly sesionesHoy = this.agendaService.sesionesHoy;

  readonly evaluacionesAbiertas = computed(() =>
    this.actividades.actividades().filter((actividad) => actividad.tipo === 'evaluacion'),
  );
  readonly correcciones = computed(() =>
    this.actividades.actividades().filter((actividad) => actividad.estado === 'requiereCorreccion'),
  );
  readonly sinNadaHoy = computed(
    () =>
      !this.actividades.eventoEnVivo() &&
      !this.evaluacionesAbiertas().length &&
      !this.correcciones().length &&
      !this.sesionesHoy().length,
  );

  constructor() {
    this.actividades.asegurarCargado();
    this.agendaService.asegurarCargado();
  }
}
