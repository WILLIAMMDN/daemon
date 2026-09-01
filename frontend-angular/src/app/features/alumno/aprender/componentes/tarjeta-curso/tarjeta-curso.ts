import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CursoVista } from '../../../models/aprendizaje.model';

/**
 * Un curso es un objeto autocontenido: es de los pocos lugares del portal donde
 * una tarjeta está justificada.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tarjeta-curso',
  imports: [RouterLink, NzProgressModule, NzTagModule],
  templateUrl: './tarjeta-curso.html',
  styleUrl: './tarjeta-curso.scss',
})
export class TarjetaCurso {
  readonly curso = input.required<CursoVista>();

  readonly enlace = computed(() => ['/alumno/aprender/curso', this.curso().id]);
  readonly colorEstado = computed(() => {
    switch (this.curso().estado) {
      case 'completed':
        return 'success';
      case 'inProgress':
        return 'processing';
      default:
        return 'default';
    }
  });
}
