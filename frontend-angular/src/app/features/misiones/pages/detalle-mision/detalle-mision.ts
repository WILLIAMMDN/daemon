import { UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight, faCircleCheck, faClock, faFileArrowUp, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { DetalleMisionRespuesta, EntregaMision, Mision } from '../../services/mision';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-mision',
  imports: [UpperCasePipe, RouterLink, FontAwesomeModule, Cargando, NzButtonModule, NzTagModule, NzCardModule, MonedaDaemon],
  templateUrl: './detalle-mision.html',
  styleUrl: './detalle-mision.scss',
})
export class DetalleMision {
  readonly detalle = signal<DetalleMisionRespuesta | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly id: number;
  readonly iconos = {
    actualizar: faRotateRight,
    check: faCircleCheck,
    entregar: faFileArrowUp,
    flecha: faArrowRight,
    regresar: faArrowLeft,
    reloj: faClock,
  };

  constructor(private readonly route: ActivatedRoute, private readonly mision: Mision) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.detalle(this.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: (problema: unknown) => {
        this.error.set(this.mensajeError(problema));
        this.cargando.set(false);
      },
    });
  }

  puedeEntregar(entrega: EntregaMision | null): boolean {
    return !entrega || entrega.estado === 'rechazado';
  }

  estadoLabel(entrega: EntregaMision | null): string {
    if (!entrega) return 'Sin entrega';
    if (entrega.estado === 'aprobado') return 'Aprobada';
    if (entrega.estado === 'pendiente') return 'En revisión';
    return 'Requiere cambios';
  }

  private mensajeError(problema: unknown): string {
    if (problema instanceof HttpErrorResponse) {
      return problema.error?.message ?? 'No pudimos cargar la misión. Inténtalo nuevamente.';
    }
    return 'No pudimos cargar la misión. Inténtalo nuevamente.';
  }
}
