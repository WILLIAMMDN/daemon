import { CommonModule } from '@angular/common';
import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { Ranking as RankingService } from '../../services/ranking';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';

interface AlumnoRanking {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  tokens: number;
  rango?: string | null;
  avatar?: string | null;
  posicion?: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ranking',
  imports: [CommonModule, Cargando, EstadoVacio, NzTagModule, MonedaDaemon],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  alumnos = signal<AlumnoRanking[]>([]);
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
        this.alumnos.set(this.normalizar(datos));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar el ranking.');
        this.cargando.set(false);
      },
    });
  }

  private normalizar(datos: unknown): AlumnoRanking[] {
    const lista = Array.isArray(datos)
      ? (datos as AlumnoRanking[])
      : Object.entries((datos ?? {}) as Record<string, AlumnoRanking[]>).flatMap(([nivel, alumnos]) =>
          (Array.isArray(alumnos) ? alumnos : []).map((alumno) => ({
            ...alumno,
            nivel: alumno.nivel || nivel,
          })),
        );

    return lista
      .sort((a, b) => {
        const tokens = Number(b.tokens ?? 0) - Number(a.tokens ?? 0);
        if (tokens !== 0) {
          return tokens;
        }

        const nombreA = a.nombre_completo || a.usuario || '';
        const nombreB = b.nombre_completo || b.usuario || '';
        return nombreA.localeCompare(nombreB);
      })
      .map((alumno, index) => ({
        ...alumno,
        tokens: Number(alumno.tokens ?? 0),
        posicion: index + 1,
      }));
  }
}
