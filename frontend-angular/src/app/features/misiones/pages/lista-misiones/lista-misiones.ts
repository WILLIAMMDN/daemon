import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Mision } from '../../services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { CommonModule } from '@angular/common';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-misiones',
  imports: [CommonModule, RouterLink, NzAlertModule, NzButtonModule, NzTagModule, NzCardModule, Cargando, EstadoVacio, BotonAccion, MonedaDaemon],
  templateUrl: './lista-misiones.html',
  styleUrl: './lista-misiones.scss',
})
export class ListaMisiones {
  misiones = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private mision: Mision) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.listar().subscribe({
      next: (misiones) => {
        this.misiones.set(misiones as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las misiones.');
        this.cargando.set(false);
      },
    });
  }
}
