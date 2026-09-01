import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { AgendaService } from '../../services/agenda.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sesiones',
  imports: [DatePipe, UpperCasePipe, NzButtonModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.scss',
})
export class Sesiones {
  readonly agendaService = inject(AgendaService);

  constructor() {
    this.agendaService.asegurarCargado();
  }
}
