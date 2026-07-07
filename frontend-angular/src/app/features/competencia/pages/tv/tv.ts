import { Component, OnDestroy, signal , ChangeDetectionStrategy} from '@angular/core';
import { Competencia } from '../../services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tv',
  imports: [Cargando],
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
