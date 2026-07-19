import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

export type TamanoEstadoVacio = 'default' | 'compact' | 'mini';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estado-vacio',
  imports: [NzEmptyModule],
  templateUrl: './estado-vacio.html',
  styleUrl: './estado-vacio.scss',
})
export class EstadoVacio {
  private readonly imagenPredeterminada = '/img/empty/empty-robot.webp';
  private imagenActual = this.imagenPredeterminada;

  @Input() titulo = 'Sin información';
  @Input() descripcion = 'Todavía no hay registros para mostrar.';
  @Input() compacto = false;
  @Input() tamano: TamanoEstadoVacio = 'default';
  @Input() anunciar = true;

  readonly imagenDisponible = signal(true);

  @Input()
  set imagen(valor: string | null | undefined) {
    this.imagenActual = valor?.trim() || this.imagenPredeterminada;
    this.imagenDisponible.set(true);
  }

  get imagen(): string {
    return this.imagenActual;
  }

  registrarImagenFallida(): void {
    this.imagenDisponible.set(false);
  }
}
