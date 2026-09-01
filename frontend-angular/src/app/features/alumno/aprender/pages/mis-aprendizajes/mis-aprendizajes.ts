import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { Aprendizaje } from '../../../services/aprendizaje';
import { TarjetaCurso } from '../../componentes/tarjeta-curso/tarjeta-curso';

/**
 * Responde “¿qué estoy aprendiendo ahora?”: cursos en progreso, cursos que
 * todavía no empiezan, historial de cursos terminados y las actividades reales
 * asociadas al aprendizaje (misiones y evaluaciones).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-aprendizajes',
  imports: [RouterLink, NzButtonModule, NzListModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio, TarjetaCurso],
  templateUrl: './mis-aprendizajes.html',
  styleUrl: './mis-aprendizajes.scss',
})
export class MisAprendizajes {
  readonly aprendizaje = inject(Aprendizaje);
  readonly actividades = inject(Actividades);

  readonly sinCursos = computed(() => this.aprendizaje.cargado() && this.aprendizaje.cursos().length === 0);
  readonly pendientes = computed(() => this.actividades.pendientes().slice(0, 5));

  constructor() {
    this.aprendizaje.asegurarCargado();
    this.actividades.asegurarCargado();
  }
}
