import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Competencia } from '../../../competencia/services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-historial-rondas',
  imports: [Cargando, NzTableModule, NzAlertModule, NzTagModule, NzButtonModule, EstadoVacio, BotonAccion],
  templateUrl: './historial-rondas.html',
  styleUrl: './historial-rondas.scss',
})
export class HistorialRondas {
  rondas = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private competencia: Competencia) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.competencia.historial().subscribe({
      next: (rondas) => {
        this.rondas.set(rondas as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el historial.');
        this.cargando.set(false);
      },
    });
  }
}
