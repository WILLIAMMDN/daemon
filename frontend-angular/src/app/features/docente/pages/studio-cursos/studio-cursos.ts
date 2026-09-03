import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CursoResumen } from '../../models/studio.model';
import { Studio } from '../../services/studio.service';
import { ErrorStudio, clasificarError } from '../../services/studio-errores';

/**
 * Listado de cursos reales que el actor académico puede operar.
 *
 * Sin métricas inventadas: todo lo que se muestra viene del backend.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-studio-cursos',
  imports: [
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzEmptyModule,
    NzResultModule,
    NzSkeletonModule,
    NzTagModule,
  ],
  templateUrl: './studio-cursos.html',
  styleUrl: './studio-cursos.scss',
})
export class StudioCursos {
  private readonly studio = inject(Studio);

  readonly cursos = signal<readonly CursoResumen[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<ErrorStudio | null>(null);

  readonly sinCursos = computed(() => !this.cargando() && !this.error() && this.cursos().length === 0);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.studio.cursos().subscribe({
      next: (respuesta) => {
        this.cursos.set(respuesta.courses);
        this.cargando.set(false);
      },
      error: (fallo) => {
        this.cargando.set(false);
        this.cursos.set([]);
        this.error.set(clasificarError(fallo, 'No pudimos cargar el catálogo de cursos.'));
      },
    });
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'published':
        return 'Publicada';
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivada';
      default:
        return estado;
    }
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'published':
        return 'success';
      case 'draft':
        return 'processing';
      default:
        return 'default';
    }
  }
}
