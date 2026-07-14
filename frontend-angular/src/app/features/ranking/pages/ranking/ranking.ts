import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRotateRight, faBolt, faCrown, faMedal, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { Ranking as RankingService } from '../../services/ranking';

interface AlumnoRanking {
  id: number;
  nombre_completo: string;
  usuario: string;
  nivel: string;
  experiencia: number;
  nivel_gamificacion: number;
  progreso_nivel?: { progreso_porcentaje: number };
  rango?: string | null;
  avatar?: string | null;
  posicion?: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ranking',
  imports: [FontAwesomeModule, NzAvatarModule, NzButtonModule, NzProgressModule, Cargando, EstadoVacio],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  readonly alumnos = signal<AlumnoRanking[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly iconos = { actualizar: faArrowRotateRight, energia: faBolt, corona: faCrown, medalla: faMedal, trofeo: faTrophy };

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

  podio(): AlumnoRanking[] {
    return this.alumnos().slice(0, 3);
  }

  resto(): AlumnoRanking[] {
    return this.alumnos().slice(3);
  }

  iniciales(alumno: AlumnoRanking): string {
    return (alumno.nombre_completo || alumno.usuario || 'D')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
  }

  private normalizar(datos: unknown): AlumnoRanking[] {
    const lista = Array.isArray(datos)
      ? (datos as AlumnoRanking[])
      : Object.entries((datos ?? {}) as Record<string, AlumnoRanking[]>).flatMap(([nivel, alumnos]) =>
          (Array.isArray(alumnos) ? alumnos : []).map((alumno) => ({ ...alumno, nivel: alumno.nivel || nivel })),
        );

    return lista
      .sort((a, b) => {
        const xp = Number(b.experiencia ?? 0) - Number(a.experiencia ?? 0);
        return xp !== 0 ? xp : (a.nombre_completo || a.usuario || '').localeCompare(b.nombre_completo || b.usuario || '');
      })
      .map((alumno, index) => ({
        ...alumno,
        experiencia: Number(alumno.experiencia ?? 0),
        nivel_gamificacion: Number(alumno.nivel_gamificacion ?? 1),
        posicion: index + 1,
      }));
  }
}
