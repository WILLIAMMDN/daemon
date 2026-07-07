import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Mision } from '../../../misiones/services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-desafios',
  imports: [RouterLink, Cargando, UpperCasePipe, EstadoVacio, NzTagModule],
  templateUrl: './mis-desafios.html',
  styleUrl: './mis-desafios.scss',
})
export class MisDesafios {
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
        this.error.set(e.error?.message ?? 'No se pudieron cargar los desafíos.');
        this.cargando.set(false);
      },
    });
  }
}
