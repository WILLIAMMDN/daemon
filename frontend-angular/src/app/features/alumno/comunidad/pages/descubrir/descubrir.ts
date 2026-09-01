import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Api } from '../../../../../core/servicios/api';
import { Cuento } from '../../../../cuentos/services/cuento';
import { CuentoRegistro } from '../../../../cuentos/models/cuento.models';
import { Actividades } from '../../../services/actividades';

interface MiembroComunidad {
  id: number;
  nombre_completo: string;
  usuario?: string | null;
  rol?: string | null;
  nivel?: string | null;
  avatar?: string | null;
}

/**
 * Descubrir — la entrada al área: qué está pasando en vivo, qué publicó la
 * comunidad hace poco y quiénes participan. Todo sale de datos reales; cuando
 * una fuente falla, esa sección desaparece en lugar de mostrar relleno.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-descubrir',
  imports: [RouterLink, NzButtonModule, NzSkeletonModule, ArcSection, EstadoVacio],
  templateUrl: './descubrir.html',
  styleUrl: './descubrir.scss',
})
export class Descubrir {
  private readonly api = inject(Api);
  private readonly cuentosServicio = inject(Cuento);
  readonly actividades = inject(Actividades);

  readonly cargando = signal(true);
  private readonly miembros = signal<MiembroComunidad[]>([]);
  private readonly publicaciones = signal<CuentoRegistro[]>([]);

  readonly companeros = computed(() => this.miembros().slice(0, 8));
  readonly recientes = computed(() => this.publicaciones().slice(0, 6));
  readonly sinNada = computed(
    () => !this.actividades.eventoEnVivo() && !this.companeros().length && !this.recientes().length,
  );

  constructor() {
    this.actividades.asegurarCargado();
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    forkJoin({
      comunidad: this.api.get<MiembroComunidad[]>('/comunidad').pipe(catchError(() => of([]))),
      cuentos: this.cuentosServicio.listar().pipe(catchError(() => of([] as CuentoRegistro[]))),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe(({ comunidad, cuentos }) => {
        this.miembros.set(Array.isArray(comunidad) ? comunidad : []);
        this.publicaciones.set(cuentos.filter((cuento) => cuento.estado !== 'borrador'));
      });
  }
}
