import { Component, signal } from '@angular/core';
import { Ranking as RankingService } from '../../services/ranking';

@Component({
  selector: 'app-ranking',
  imports: [],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private ranking: RankingService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.ranking.listar().subscribe({
      next: (datos) => {
        this.alumnos.set(datos as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el ranking.');
        this.cargando.set(false);
      },
    });
  }
}
