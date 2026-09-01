import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize } from 'rxjs';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Sesion } from '../../../../../core/servicios/sesion';
import { Cuento } from '../../../../cuentos/services/cuento';
import { CuentoRegistro } from '../../../../cuentos/models/cuento.models';

/**
 * Portafolio — el trabajo del estudiante que ya está publicado.
 *
 * La única fuente de obra publicable que la plataforma expone hoy son los
 * cuentos del propio alumno. Cuando existan otros tipos de proyecto publicable
 * se añaden aquí; no se rellena con obra inventada.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-portafolio',
  imports: [RouterLink, NzAlertModule, NzButtonModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio {
  private readonly cuentos = inject(Cuento);
  private readonly sesion = inject(Sesion);

  readonly cargando = signal(true);
  readonly error = signal(false);
  private readonly mios = signal<CuentoRegistro[]>([]);

  readonly publicados = computed(() => this.mios().filter((cuento) => cuento.estado !== 'borrador'));
  readonly borradores = computed(() => this.mios().filter((cuento) => cuento.estado === 'borrador'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.cuentos
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (registros) => this.mios.set(registros.filter((cuento) => this.esMio(cuento))),
        error: () => this.error.set(true),
      });
  }

  private esMio(cuento: CuentoRegistro): boolean {
    const id = this.sesion.usuario()?.id;
    return id !== undefined && String(cuento.id_alumno ?? '') === String(id);
  }
}
