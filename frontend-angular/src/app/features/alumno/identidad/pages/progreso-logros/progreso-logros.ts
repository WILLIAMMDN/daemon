import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { catchError, finalize, of } from 'rxjs';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { CertificadoData, Insignia } from '../../../../../core/modelos/dto';
import { CertificadoService } from '../../../../certificados/services/certificado';
import { IdentidadAlumno } from '../../services/identidad';

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
  readonly identidad = inject(IdentidadAlumno);
  private readonly certificados = inject(CertificadoService);

  readonly cargandoLogros = signal(true);
  private readonly certificado = signal<CertificadoData | null>(null);

  readonly insignias = computed<Insignia[]>(() => this.certificado()?.insignias ?? []);
  readonly diasActivos = computed(
    () => this.identidad.panel()?.actividad_semana.filter((dia) => dia.activo).length ?? 0,
  );

  constructor() {
    this.identidad.asegurarCargado();

    this.certificados
      .actual()
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.cargandoLogros.set(false)),
      )
      .subscribe((datos) => this.certificado.set(datos));
  }
}
