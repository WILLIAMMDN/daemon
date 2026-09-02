import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { PulseService } from '../../../../../core/servicios/pulse.service';

/**
 * Progreso y logros — la progresión del jugador: nivel, XP, racha, actividad y
 * las insignias realmente otorgadas (`/certificados`). El Mastery académico se
 * queda en Aprender.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-progreso-logros',
  imports: [
    DatePipe,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzListModule,
    NzProgressModule,
    NzSkeletonModule,
    ArcSection,
    EstadoVacio,
  ],
  templateUrl: './progreso-logros.html',
  styleUrl: './progreso-logros.scss',
})
export class ProgresoLogros {
  readonly pulse = inject(PulseService);

  constructor() {
    this.pulse.ensureSnapshot();
    this.pulse.ensureAchievements();
  }
}
