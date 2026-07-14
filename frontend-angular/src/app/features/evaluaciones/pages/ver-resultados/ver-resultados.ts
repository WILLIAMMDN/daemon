import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Evaluacion } from '../../services/evaluacion';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CommonModule } from '@angular/common';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-resultados',
  imports: [CommonModule, Cargando, NzTableModule, NzAlertModule, NzTagModule, BotonAccion, EstadoVacio, NzCardModule],
  templateUrl: './ver-resultados.html',
  styleUrl: './ver-resultados.scss',
})
export class VerResultados {
  resultados = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private evaluacion: Evaluacion) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.evaluacion.resultados().subscribe({
      next: (resultados) => {
        this.resultados.set(resultados as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar los resultados.');
        this.cargando.set(false);
      },
    });
  }
}
