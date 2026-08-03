import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Tienda } from '../../services/tienda';
import { Canje } from '../../../../core/modelos/dto';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { NzCardModule } from 'ng-zorro-antd/card';
import { UpperCasePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-canjes',
  imports: [NzTableModule, NzTagModule, NzAlertModule, Cargando, EstadoVacio, BotonAccion, NzCardModule, UpperCasePipe],
  templateUrl: './mis-canjes.html',
  styleUrl: './mis-canjes.scss',
})
export class MisCanjes {
  canjes = signal<Canje[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private tienda: Tienda) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.canjes().subscribe({
      next: (canjes: Canje[]) => {
        this.canjes.set(canjes);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los canjes.');
        this.cargando.set(false);
      },
    });
  }
}
