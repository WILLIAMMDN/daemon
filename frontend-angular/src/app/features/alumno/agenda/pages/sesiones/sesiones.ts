import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { AgendaService } from '../../services/agenda.service';
import { SesionAprendizajeDto } from '../../../models/contexto-alumno.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sesiones',
  imports: [DatePipe, NzAlertModule, NzButtonModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.scss',
})
export class Sesiones {
  readonly agendaService = inject(AgendaService);

  constructor() {
    this.agendaService.asegurarCargado();
  }

  etiquetaEstado(sesion: SesionAprendizajeDto): string {
    switch (sesion.status) {
      case 'scheduled':
        return 'Programada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Finalizada';
      default:
        return sesion.status;
    }
  }

  colorEstado(sesion: SesionAprendizajeDto): string {
    switch (sesion.status) {
      case 'scheduled':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }
}
