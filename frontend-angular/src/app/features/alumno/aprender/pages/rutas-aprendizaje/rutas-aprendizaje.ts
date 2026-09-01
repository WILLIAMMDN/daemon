import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Aprendizaje } from '../../../services/aprendizaje';

/**
 * Las rutas de aprendizaje son la secuencia de unidades de cada curso. No es
 * otro catálogo: aquí importa el orden, dónde te quedaste y qué objetivos de
 * aprendizaje cubre cada tramo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rutas-aprendizaje',
  imports: [RouterLink, NzButtonModule, NzProgressModule, NzSkeletonModule, NzTagModule, ArcSection, EstadoVacio],
  templateUrl: './rutas-aprendizaje.html',
  styleUrl: './rutas-aprendizaje.scss',
})
export class RutasAprendizaje {
  readonly aprendizaje = inject(Aprendizaje);

  readonly rutas = computed(() => this.aprendizaje.cursos().filter((curso) => curso.unidades.length > 0));
  readonly sinRutas = computed(() => this.aprendizaje.cargado() && this.rutas().length === 0);

  constructor() {
    this.aprendizaje.asegurarCargado();
  }
}
