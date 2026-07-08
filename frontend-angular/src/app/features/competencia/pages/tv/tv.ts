import { Component, OnDestroy, signal , ChangeDetectionStrategy} from '@angular/core';
import { Competencia } from '../../services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tv',
  imports: [Cargando, NzButtonModule, NzAlertModule, NzTagModule],
  templateUrl: './tv.html',
  styleUrl: './tv.scss',
})
export class Tv implements OnDestroy {
  estado = signal<any | null>(null);
  error = signal('');
  private timer = window.setInterval(() => this.cargar(), 5000);

  constructor(private competencia: Competencia) {
    this.cargar();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
  }

  cargar(): void {
    this.competencia.estado().subscribe({
      next: (estado) => this.estado.set(estado),
      error: (e) => this.error.set(e.error?.message ?? 'No se pudo cargar la competencia.'),
    });
  }
}
