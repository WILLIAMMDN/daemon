import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';
import { Actividades } from '../../../services/actividades';
import { Aprendizaje } from '../../../services/aprendizaje';
import { TarjetaCurso } from '../../componentes/tarjeta-curso/tarjeta-curso';
import { ListaActividades } from '../../../componentes/lista-actividades/lista-actividades';
import {
  canonizarTipoExperiencia,
  ETIQUETA_TIPO_EXPERIENCIA,
} from '../../../models/contexto-alumno.model';

export interface SiguientePasoVista {
  titulo: string;
  tipoLabel: string;
  ruta: unknown[];
  ctaTexto: string;
}

/**
 * Mis cursos — Experiencia canónica de aprendizaje del estudiante.
 *
 * Responde las 4 preguntas esenciales:
 * 1. ¿Qué estoy aprendiendo? (Cursos asignados e identidad académica)
 * 2. ¿Dónde estoy? (Progreso real y porcentaje de avance)
 * 3. ¿Qué hago ahora? (Siguiente acción del Learning Core)
 * 4. ¿Qué progreso he realizado? (Lecciones e hitos completados)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-cursos',
  imports: [
    RouterLink,
    NzButtonModule,
    NzProgressModule,
    NzSkeletonModule,
    NzTagModule,
    ArcSection,
    EstadoVacio,
    TarjetaCurso,
    ListaActividades,
  ],
  templateUrl: './mis-cursos.html',
  styleUrl: './mis-cursos.scss',
})
export class MisCursos {
  readonly aprendizaje = inject(Aprendizaje);
  readonly actividades = inject(Actividades);

  readonly sinCursos = computed(() => this.aprendizaje.cargado() && this.aprendizaje.cursos().length === 0);
  readonly pendientes = computed(() => this.actividades.pendientes().slice(0, 5));

  readonly cursoPrincipal = computed(() => {
    const cursos = this.aprendizaje.cursos();
    if (cursos.length === 0) return null;
    const enCurso = this.aprendizaje.enProgreso();
    return enCurso.length > 0 ? enCurso[0] : cursos[0];
  });

  readonly otrosEnProgreso = computed(() => {
    const principal = this.cursoPrincipal();
    if (!principal) return [];
    return this.aprendizaje.enProgreso().filter((c) => c.id !== principal.id);
  });

  readonly porIniciar = computed(() => {
    const principal = this.cursoPrincipal();
    if (!principal) return this.aprendizaje.porIniciar();
    return this.aprendizaje.porIniciar().filter((c) => c.id !== principal.id);
  });

  readonly completados = computed(() => {
    const principal = this.cursoPrincipal();
    if (!principal) return this.aprendizaje.completados();
    return this.aprendizaje.completados().filter((c) => c.id !== principal.id);
  });

  readonly siguientePaso = computed<SiguientePasoVista | null>(() => {
    const curso = this.cursoPrincipal();
    if (!curso) return null;

    const nextItem = this.aprendizaje.mapa()?.nextItem;
    if (nextItem) {
      const tipo = canonizarTipoExperiencia(nextItem.type);
      const etiqueta = ETIQUETA_TIPO_EXPERIENCIA[tipo] || 'Actividad';
      return {
        titulo: nextItem.title,
        tipoLabel: etiqueta,
        ruta: ['/alumno/aprender/curso', curso.id, 'experiencia', nextItem.id],
        ctaTexto: `Continuar: ${nextItem.title}`,
      };
    }

    if (curso.siguienteLeccion) {
      return {
        titulo: curso.siguienteLeccion.titulo,
        tipoLabel: 'Lección',
        ruta: ['/alumno/aprender/curso', curso.id],
        ctaTexto: `Continuar: ${curso.siguienteLeccion.titulo}`,
      };
    }

    return {
      titulo: 'Has completado todas las lecciones publicadas',
      tipoLabel: 'Curso al día',
      ruta: ['/alumno/aprender/curso', curso.id],
      ctaTexto: 'Ver curso',
    };
  });

  readonly proximaSesion = computed(() => {
    return this.aprendizaje.homeContext()?.nextLiveSession ?? null;
  });

  readonly aulaInfo = computed(() => {
    const enrol = this.aprendizaje.learningContext()?.currentEnrollment;
    return enrol?.aula ?? null;
  });

  constructor() {
    this.aprendizaje.asegurarCargado();
    this.actividades.asegurarCargado();
  }
}
