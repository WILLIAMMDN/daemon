import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Mision } from '../../services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CommonModule } from '@angular/common';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-mision',
  imports: [CommonModule, RouterLink, Cargando, NzAlertModule, NzTagModule, MonedaDaemon],
  templateUrl: './detalle-mision.html',
  styleUrl: './detalle-mision.scss',
})
export class DetalleMision {
  detalle = signal<any | null>(null);
  cargando = signal(true);
  error = signal('');
  id: number;

  constructor(private route: ActivatedRoute, private mision: Mision) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.detalle(this.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la misión.');
        this.cargando.set(false);
      },
    });
  }
}
