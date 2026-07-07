import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mision } from '../../../misiones/services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-herramientas-clase',
  imports: [CommonModule, FormsModule, Cargando, NzTableModule, NzAlertModule, NzTagModule, NzButtonModule, NzModalModule, EstadoVacio],
  templateUrl: './herramientas-clase.html',
  styleUrl: './herramientas-clase.scss',
})
export class HerramientasClase {
  entregas = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  revision = { id: null as number | null, estado: 'aprobado', calificacion: null as number | null, comentario_docente: '' };

  constructor(private mision: Mision) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.entregas().subscribe({
      next: (entregas) => {
        this.entregas.set(entregas as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las entregas.');
        this.cargando.set(false);
      },
    });
  }

  seleccionar(entrega: any): void {
    this.revision = {
      id: entrega.id,
      estado: entrega.estado === 'rechazado' ? 'rechazado' : 'aprobado',
      calificacion: entrega.calificacion ?? entrega.recompensa ?? null,
      comentario_docente: entrega.comentario_docente ?? '',
    };
  }

  revisar(): void {
    if (!this.revision.id) return;
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.mision.revisar(this.revision.id, this.revision).subscribe({
      next: () => {
        this.mensaje.set('Entrega revisada.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo revisar la entrega.');
        this.guardando.set(false);
      },
    });
  }
}
