import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { filter, finalize, map } from 'rxjs';
import { ArcMiga, ArcPage } from '../../../../../shared/componentes/arc-page/arc-page';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { LeccionVista } from '../../../models/aprendizaje.model';
import {
  canonizarTipoExperiencia,
  ETIQUETA_TIPO_EXPERIENCIA,
  ExperienciaAprendizajeDto,
  HitoAprendizajeDto,
} from '../../../models/contexto-alumno.model';
import { Aprendizaje } from '../../../services/aprendizaje';

export type SubvistaCurso = 'resumen' | 'ruta' | 'contenido' | 'progreso';

export interface SiguienteAccionCurso {
  id?: number;
  titulo: string;
  tipoLabel: string;
  ruta: unknown[];
  ctaTexto: string;
}

/**
 * Espacio contextual del curso (`/alumno/aprender/curso/:cursoId`).
 *
 * Expone la navegación contextual del curso:
 * - Resumen: Identidad, contexto de matrícula, progreso actual, siguiente acción, objetivos.
 * - Ruta: Mapa de aprendizaje estructurado (milestones + experiencias con estados del Learning Core).
 * - Contenido: Lista accesible y estructurada de unidades/lecciones con metadatos de tipo.
 * - Progreso: Avance académico real (porcentaje, hitos, experiencias, objetivos logrados).
 *
 * Estas pestañas pertenecen a la navegación interna del curso y NO al Sidebar global.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-espacio-curso',
  imports: [
    DatePipe,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzProgressModule,
    NzResultModule,
    NzSkeletonModule,
    NzTagModule,
    ArcPage,
    ArcSection,
    EstadoVacio,
  ],
  templateUrl: './espacio-curso.html',
  styleUrl: './espacio-curso.scss',
})
export class EspacioCurso {
  private readonly aprendizaje = inject(Aprendizaje);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly cursoId = toSignal(
    this.ruta.paramMap.pipe(map((parametros) => parametros.get('cursoId'))),
    { initialValue: this.ruta.snapshot.paramMap.get('cursoId') },
  );

  private readonly urlEvento = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly subvista = computed<SubvistaCurso>(() => {
    const url = this.urlEvento() || this.router.url;
    if (url.includes('/ruta')) return 'ruta';
    if (url.includes('/contenido')) return 'contenido';
    if (url.includes('/progreso')) return 'progreso';
    return 'resumen';
  });

  readonly cargando = this.aprendizaje.cargando;
  readonly guardando = signal<number | null>(null);
  readonly errorAccion = signal('');
  readonly confirmacion = signal('');

  readonly curso = computed(() => this.aprendizaje.curso(Number(this.cursoId())));
  readonly noEncontrado = computed(() => this.aprendizaje.cargado() && this.curso() === null);

  readonly mapa = this.aprendizaje.mapa;
  readonly hitos = computed<HitoAprendizajeDto[]>(() => this.mapa()?.milestones ?? []);

  readonly matricula = computed(() => this.aprendizaje.learningContext()?.currentEnrollment ?? null);
  readonly aula = computed(() => this.matricula()?.cohort ?? null);
  readonly proximaSesion = computed(() => this.aprendizaje.homeContext()?.nextLiveSession ?? null);

  readonly siguienteAccion = computed<SiguienteAccionCurso | null>(() => {
    const curso = this.curso();
    if (!curso) return null;

    const nextItem = this.mapa()?.nextItem;
    if (nextItem) {
      const tipo = canonizarTipoExperiencia(nextItem.type);
      const tipoLabel = ETIQUETA_TIPO_EXPERIENCIA[tipo] || 'Actividad';
      return {
        id: nextItem.id,
        titulo: nextItem.title,
        tipoLabel,
        ruta: ['/alumno/aprender/curso', curso.id, 'experiencia', nextItem.id],
        ctaTexto: `Continuar: ${nextItem.title}`,
      };
    }

    if (curso.siguienteLeccion) {
      return {
        id: curso.siguienteLeccion.id,
        titulo: curso.siguienteLeccion.titulo,
        tipoLabel: 'Lección',
        ruta: ['/alumno/aprender/curso', curso.id, 'contenido'],
        ctaTexto: `Continuar: ${curso.siguienteLeccion.titulo}`,
      };
    }

    return null;
  });

  readonly hitosCompletadosConteo = computed(() => {
    return this.hitos().filter((h) => h.state === 'completed').length;
  });

  /** Sin mapa de ruta (curso legacy) el avance real sigue siendo el de lecciones. */
  readonly experienciasRequeridasTotal = computed(() => {
    const progreso = this.mapa()?.progress;
    return progreso ? progreso.requiredExperienceCount : (this.curso()?.totalLecciones ?? 0);
  });

  readonly experienciasRequeridasCompletadas = computed(() => {
    const progreso = this.mapa()?.progress;
    return progreso ? progreso.completedRequiredExperienceCount : (this.curso()?.leccionesCompletadas ?? 0);
  });

  /**
   * Avance canónico del curso: es el de Learning Core (experiencias requeridas
   * de la ruta), no el de lecciones. `/alumno/aprendizaje` solo conoce la tabla
   * legacy `lecciones` — en IA: Origen son 6 frente a 18 experiencias
   * obligatorias, así que usarlo como avance total del curso miente.
   * Solo cuando el curso no tiene ruta publicada queda el avance de lecciones.
   */
  readonly avanceCursoPorcentaje = computed(() => {
    const mapa = this.mapa();
    return mapa?.path ? mapa.progress.percent : (this.curso()?.porcentaje ?? 0);
  });

  readonly objetivosAcademicos = computed(() => {
    const curso = this.curso();
    if (!curso) return [];
    const mapa = new Map<number, { id: number; codigo?: string | null; descripcion: string; logrado: boolean }>();

    for (const unidad of curso.unidades) {
      for (const leccion of unidad.lecciones) {
        const logrado = leccion.progresoActual.estado === 'completed';
        for (const obj of leccion.objetivos ?? []) {
          const prev = mapa.get(obj.id);
          mapa.set(obj.id, {
            id: obj.id,
            codigo: obj.codigo,
            descripcion: obj.descripcion,
            logrado: (prev?.logrado ?? false) || logrado,
          });
        }
      }
    }
    return [...mapa.values()];
  });

  readonly objetivosLogradosConteo = computed(() => {
    return this.objetivosAcademicos().filter((o) => o.logrado).length;
  });

  readonly objetivosPorcentaje = computed(() => {
    const total = this.objetivosAcademicos().length;
    if (total === 0) return 0;
    return Math.round((this.objetivosLogradosConteo() * 100) / total);
  });

  readonly migas = computed<ArcMiga[]>(() => [
    { etiqueta: 'Aprender', ruta: '/alumno/aprender' },
    { etiqueta: 'Mis cursos', ruta: '/alumno/aprender/mis-cursos' },
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

  tipoEtiqueta(tipo: string): string {
    const canonico = canonizarTipoExperiencia(tipo);
    return ETIQUETA_TIPO_EXPERIENCIA[canonico] || tipo;
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
          this.confirmacion.set(`Marcaste "${leccion.titulo}" como completada.`);
        },
        error: () =>
          this.errorAccion.set('No pudimos guardar tu avance. Tu contenido sigue disponible y puedes reintentarlo.'),
      });
  }
}
