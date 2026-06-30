import { Component, signal } from '@angular/core';
import { Competencia } from '../../../competencia/services/competencia';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';


@Component({
  selector: 'app-historial-rondas',
  imports: [Cargando],
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
