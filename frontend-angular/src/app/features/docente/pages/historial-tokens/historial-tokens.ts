import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Docente } from '../../services/docente';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-historial-tokens',
  imports: [Cargando],
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
