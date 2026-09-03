import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, map } from 'rxjs';
import { ArcMiga, ArcPage } from '../../../../../shared/componentes/arc-page/arc-page';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import {
  canonizarTipoExperiencia,
  ETIQUETA_TIPO_EXPERIENCIA,
  ExperienciaAprendizajeDto,
  TipoExperienciaCanonico,
} from '../../../models/contexto-alumno.model';
import { Aprendizaje } from '../../../services/aprendizaje';

/**
 * Shell canónico y reutilizable de Experiencias de Aprendizaje.
 *
 * Ruta: `/alumno/aprender/curso/:cursoId/experiencia/:experienceId`
 *
 * Responsabilidades comunes:
 * - Contexto y migas de pan del curso
 * - Título, tipo y objetivos académicos asociados
 * - Estado de progreso de la experiencia
 * - Cuerpo de contenido/instrucciones adaptado al tipo
 * - Área de acción y entrega de evidencia
 * - Navegación contextual secuencial (anterior / siguiente)
 *
 * Reutilizable para: lesson, practice, mission, lab, assessment, project, challenge.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-experiencia',
  imports: [
    RouterLink,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzInputModule,
    NzResultModule,
    NzSkeletonModule,
    NzTagModule,
    ArcPage,
    ArcSection,
  ],
  templateUrl: './experiencia.html',
  styleUrl: './experiencia.scss',
})
export class Experiencia {
  private readonly aprendizaje = inject(Aprendizaje);
  private readonly ruta = inject(ActivatedRoute);

  readonly cursoId = toSignal(
    this.ruta.paramMap.pipe(map((parametros) => parametros.get('cursoId'))),
    { initialValue: this.ruta.snapshot.paramMap.get('cursoId') },
  );

  readonly experienceId = toSignal(
    this.ruta.paramMap.pipe(map((parametros) => parametros.get('experienceId'))),
    { initialValue: this.ruta.snapshot.paramMap.get('experienceId') },
  );

  readonly cargando = this.aprendizaje.cargando;
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly evidenciaTexto = signal('');
  readonly intentoIniciado = signal<number | null>(null);

  readonly curso = computed(() => this.aprendizaje.curso(Number(this.cursoId())));
  readonly mapa = this.aprendizaje.mapa;

  readonly todasExperiencias = computed<ExperienciaAprendizajeDto[]>(() => {
    return this.mapa()?.milestones.flatMap((h) => h.experiences) ?? [];
  });

  readonly experiencia = computed<ExperienciaAprendizajeDto | null>(() => {
    const id = Number(this.experienceId());
    const encontrada = this.todasExperiencias().find((e) => e.id === id);
    if (encontrada) return encontrada;

    // Fallback: si no está en el mapa, busca en lecciones de unidades del curso
    const curso = this.curso();
    if (!curso) return null;
    for (const unidad of curso.unidades) {
      const leccion = unidad.lecciones.find((l) => l.id === id);
      if (leccion) {
        return {
          id: leccion.id,
          type: 'lesson',
          title: leccion.titulo,
          order: leccion.orden,
          required: true,
          state: leccion.progresoActual.estado === 'completed' ? 'completed' : 'unlocked',
          progressPercent: leccion.progresoActual.porcentaje,
          objectives: (leccion.objetivos ?? []).map((o) => ({
            id: o.id,
            code: o.codigo,
            description: o.descripcion,
          })),
        };
      }
    }
    return null;
  });

  readonly noEncontrada = computed(() => {
    return this.aprendizaje.cargado() && this.experiencia() === null;
  });

  readonly tipoCanonico = computed<TipoExperienciaCanonico>(() => {
    const exp = this.experiencia();
    return canonizarTipoExperiencia(exp?.type ?? 'lesson');
  });

  readonly tipoEtiqueta = computed(() => {
    return ETIQUETA_TIPO_EXPERIENCIA[this.tipoCanonico()] || 'Experiencia';
  });

  readonly indiceActual = computed(() => {
    const id = Number(this.experienceId());
    return this.todasExperiencias().findIndex((e) => e.id === id);
  });

  readonly anterior = computed<ExperienciaAprendizajeDto | null>(() => {
    const idx = this.indiceActual();
    return idx > 0 ? this.todasExperiencias()[idx - 1] : null;
  });

  readonly siguiente = computed<ExperienciaAprendizajeDto | null>(() => {
    const idx = this.indiceActual();
    const lista = this.todasExperiencias();
    return idx >= 0 && idx < lista.length - 1 ? lista[idx + 1] : null;
  });

  readonly migas = computed<ArcMiga[]>(() => [
    { etiqueta: 'Aprender', ruta: '/alumno/aprender' },
    { etiqueta: 'Mis cursos', ruta: '/alumno/aprender/mis-cursos' },
    { etiqueta: this.curso()?.titulo ?? 'Curso', ruta: `/alumno/aprender/curso/${this.cursoId()}` },
    { etiqueta: this.experiencia()?.title ?? 'Experiencia' },
  ]);

  constructor() {
    this.aprendizaje.asegurarCargado();
  }

  completarComoLeccion(): void {
    const exp = this.experiencia();
    if (!exp || exp.state === 'completed' || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    this.feedback.set(null);

    const leccionId = exp.sourceId || exp.id;
    this.aprendizaje
      .completarLeccion(leccionId)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: (progreso) => {
          this.aprendizaje.aplicarProgreso(leccionId, progreso);
          this.feedback.set(`Completaste "${exp.title}" con éxito.`);
        },
        error: () => {
          this.error.set('No pudimos registrar tu avance. Puedes intentarlo de nuevo.');
        },
      });
  }

  iniciarIntento(): void {
    const exp = this.experiencia();
    if (!exp || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    this.feedback.set(null);

    const clave = `intento-${exp.id}-${Date.now()}`;
    this.aprendizaje
      .iniciarIntento(exp.id, clave)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: (intento) => {
          this.intentoIniciado.set(intento.id);
          this.feedback.set(`Intento #${intento.numero} iniciado. Ya puedes trabajar en tu entrega.`);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No fue posible iniciar un nuevo intento para esta experiencia.');
        },
      });
  }

  readonly bloquesContenido = computed<any[]>(() => {
    const exp = this.experiencia();
    if (!exp || !exp.content) return [];
    if (typeof exp.content === 'object' && exp.content !== null) {
      const c = exp.content as Record<string, any>;
      if (Array.isArray(c['bloques'])) return c['bloques'];
    }
    return [];
  });

  readonly guiaEntrega = computed<Record<string, any> | null>(() => {
    const exp = this.experiencia();
    if (!exp || !exp.instructions) return null;
    if (typeof exp.instructions === 'object') {
      return exp.instructions as Record<string, any>;
    }
    return null;
  });

  private resolverTipoEvidencia(tipo: TipoExperienciaCanonico): string {
    switch (tipo) {
      case 'lab':
        return 'lab_output';
      case 'mission':
        return 'mission_delivery';
      case 'practice':
        return 'practice_result';
      case 'assessment':
        return 'assessment_result';
      case 'project':
        return 'artifact';
      default:
        return 'submission';
    }
  }

  entregarEvidencia(): void {
    const intentoId = this.intentoIniciado();
    const texto = this.evidenciaTexto().trim();
    if (!intentoId || !texto || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    this.feedback.set(null);

    this.aprendizaje
      .entregarEvidencia(intentoId, {
        tipo: this.resolverTipoEvidencia(this.tipoCanonico()),
        referencia: texto,
        metadatos: { enviado_desde: 'learning-experience-shell' },
      })
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('Tu evidencia fue enviada correctamente.');
          this.evidenciaTexto.set('');
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Ocurrió un problema al enviar la evidencia.');
        },
      });
  }
}
