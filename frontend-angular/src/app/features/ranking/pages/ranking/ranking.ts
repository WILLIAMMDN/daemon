import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRotateRight, faBolt, faCrown, faMedal, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ApiError } from '../../../../core/servicios/api';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { AlumnoRanking } from '../../models/ranking.model';
import { Ranking as RankingService } from '../../services/ranking';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ranking',
  imports: [FontAwesomeModule, NzAvatarModule, NzButtonModule, NzProgressModule, Cargando, EstadoVacio],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class Ranking {
  readonly alumnos = signal<AlumnoRanking[]>([]);
  readonly scopeLabel = signal('Tu grupo');
  readonly participantes = signal(0);
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
        this.alumnos.set(datos.alumnos);
        this.scopeLabel.set(datos.scope_label);
        this.participantes.set(datos.participantes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(error instanceof ApiError
          ? 'No hay conexión para actualizar las posiciones. Inténtalo nuevamente.'
          : 'No se pudo cargar el ranking de tu grupo.');
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
    return (alumno.nombre_mostrado || 'D')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || 'D';
  }
}
