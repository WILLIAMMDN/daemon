import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Docente } from '../../services/docente';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-historial-tokens',
  imports: [CommonModule, Cargando, NzTableModule, NzAlertModule, NzTagModule, NzButtonModule, EstadoVacio, BotonAccion, MonedaDaemon],
  templateUrl: './historial-tokens.html',
  styleUrl: './historial-tokens.scss',
})
export class HistorialTokens {
  movimientos = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private docente: Docente) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.docente.historialTokens().subscribe({
      next: (movimientos) => {
        this.movimientos.set(movimientos as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el historial.');
        this.cargando.set(false);
      },
    });
  }
}
