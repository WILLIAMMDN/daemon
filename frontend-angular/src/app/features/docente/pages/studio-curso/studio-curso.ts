import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CursoResumen, VersionResumen } from '../../models/studio.model';
import { ErrorStudio, clasificarError, mensajeDeError } from '../../services/studio-errores';
import { Studio } from '../../services/studio.service';

/**
 * Versiones de un curso: estado, autoría y creación de un borrador nuevo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-studio-curso',
  imports: [
    DatePipe,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzEmptyModule,
    NzPopconfirmModule,
    NzResultModule,
    NzSkeletonModule,
    NzTagModule,
  ],
  templateUrl: './studio-curso.html',
  styleUrl: './studio-curso.scss',
})
export class StudioCurso {
  private readonly studio = inject(Studio);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);

  private readonly parametros = toSignal(this.ruta.paramMap, { initialValue: this.ruta.snapshot.paramMap });
  readonly courseId = computed(() => this.parametros().get('courseId') ?? '');

  readonly curso = signal<CursoResumen | null>(null);
  readonly cargando = signal(true);
  readonly clonando = signal<number | null>(null);
  readonly error = signal<ErrorStudio | null>(null);

  constructor() {
    // El componente se reutiliza al navegar entre cursos: recargar con el id vivo.
    effect(() => {
      const id = this.courseId();
      if (id) {
        this.cargar();
      }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.studio.curso(Number(this.courseId())).subscribe({
      next: (respuesta) => {
        this.curso.set(respuesta.course);
        this.cargando.set(false);
      },
      error: (fallo) => {
        this.cargando.set(false);
        this.curso.set(null);
        this.error.set(clasificarError(fallo, 'No pudimos cargar este curso.'));
      },
    });
  }

  crearBorrador(version: VersionResumen): void {
    this.clonando.set(version.id);

    this.studio.crearBorrador(version.id).subscribe({
      next: (detalle) => {
        this.clonando.set(null);
        this.message.success(`Borrador V${detalle.version.number} creado desde V${version.number}.`);
        void this.router.navigate(['/docente/cursos', this.courseId(), 'version', detalle.version.id]);
      },
      error: (fallo) => {
        this.clonando.set(null);
        this.message.error(mensajeDeError(fallo, 'No se pudo crear el borrador.'));
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
