import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, map } from 'rxjs';
import { ArcMiga, ArcPage } from '../../../../../shared/componentes/arc-page/arc-page';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { LeccionVista } from '../../../models/aprendizaje.model';
import { Aprendizaje } from '../../../services/aprendizaje';

/**
 * Espacio de aprendizaje de un curso matriculado real (`/alumno/aprendizaje`).
 *
 * Sólo expone secciones que el modelo de datos sostiene hoy: resumen, contenido
 * (unidades y lecciones) y progreso académico por objetivos. No hay pestañas de
 * sesiones, laboratorios ni tutor IA porque la plataforma no expone esos datos
 * por curso y una pestaña permanentemente vacía es peor que no tenerla.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-espacio-curso',
  imports: [
    NzAlertModule,
    NzButtonModule,
    NzProgressModule,
    NzResultModule,
    NzSkeletonModule,
    NzTagModule,
    ArcPage,
    ArcSection,
  ],
  templateUrl: './espacio-curso.html',
  styleUrl: './espacio-curso.scss',
})
export class EspacioCurso {
  private readonly aprendizaje = inject(Aprendizaje);
  private readonly ruta = inject(ActivatedRoute);

  readonly cursoId = toSignal(
    this.ruta.paramMap.pipe(map((parametros) => parametros.get('cursoId'))),
    { initialValue: this.ruta.snapshot.paramMap.get('cursoId') },
  );

  readonly cargando = this.aprendizaje.cargando;
  readonly guardando = signal<number | null>(null);
  readonly errorAccion = signal('');
  readonly confirmacion = signal('');

  readonly curso = computed(() => this.aprendizaje.curso(Number(this.cursoId())));
  readonly noEncontrado = computed(() => this.aprendizaje.cargado() && this.curso() === null);

  readonly objetivosPorcentaje = computed(() => {
    const curso = this.curso();
    if (!curso || curso.objetivosTotales === 0) return 0;
    return Math.round((curso.objetivosLogrados * 100) / curso.objetivosTotales);
  });

  readonly migas = computed<ArcMiga[]>(() => [
    { etiqueta: 'Aprender', ruta: '/alumno/aprender' },
    { etiqueta: 'Mis aprendizajes', ruta: '/alumno/aprender/mis-aprendizajes' },
    { etiqueta: this.curso()?.titulo ?? 'Curso' },
  ]);

  constructor() {
    this.aprendizaje.asegurarCargado();

    effect(() => {
      this.cursoId();
      this.errorAccion.set('');
      this.confirmacion.set('');
    });
  }

  completar(leccion: LeccionVista): void {
    if (leccion.progresoActual.estado === 'completed' || this.guardando() !== null) return;

    this.guardando.set(leccion.id);
    this.errorAccion.set('');
    this.confirmacion.set('');

    this.aprendizaje
      .completarLeccion(leccion.id)
      .pipe(finalize(() => this.guardando.set(null)))
      .subscribe({
        next: (progreso) => {
          this.aprendizaje.aplicarProgreso(leccion.id, progreso);
          this.confirmacion.set('Marcaste "' + leccion.titulo + '" como completada.');
        },
        error: () =>
          this.errorAccion.set('No pudimos guardar tu avance. Tu contenido sigue disponible y puedes reintentarlo.'),
      });
  }
}
