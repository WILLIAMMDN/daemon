import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faClipboardCheck,
  faEye,
  faGraduationCap,
  faRotateRight,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { Docente } from '../../services/docente';
import { IntentoRevisionDto } from '../../models/revision.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-revisiones-docente',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzEmptyModule,
    NzInputModule,
    NzModalModule,
    NzRadioModule,
    NzSelectModule,
    NzSkeletonModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
    FontAwesomeModule,
  ],
  templateUrl: './revisiones.html',
  styleUrl: './revisiones.scss',
})
export class RevisionesDocente {
  private readonly docenteService = inject(Docente);

  readonly iconos = {
    revisiones: faClipboardCheck,
    ver: faEye,
    aprobar: faCheck,
    rechazar: faXmark,
    recargar: faRotateRight,
    alumno: faUser,
    curso: faGraduationCap,
  };

  readonly cargando = signal(true);
  readonly intentos = signal<IntentoRevisionDto[]>([]);
  readonly error = signal<string | null>(null);
  readonly feedbackMensaje = signal<string | null>(null);

  readonly pestanaActiva = signal<'pending' | 'reviewed'>('pending');
  readonly filtroCursoId = signal<number | null>(null);
  readonly filtroAulaId = signal<number | null>(null);

  readonly modalVisible = signal(false);
  readonly intentoSeleccionado = signal<IntentoRevisionDto | null>(null);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);

  // Formulario de evaluación formativa
  readonly formAprobado = signal(true);
  readonly formPuntaje = signal<number | null>(null);
  readonly formComentario = signal('');

  readonly pendientes = computed(() => {
    return this.intentos().filter((i) => i.status === 'submitted');
  });

  readonly revisadas = computed(() => {
    return this.intentos().filter((i) => i.status === 'evaluated');
  });

  readonly cursosDisponibles = computed(() => {
    const mapa = new Map<number, string>();
    for (const item of this.intentos()) {
      if (item.course?.id && item.course?.title) {
        mapa.set(item.course.id, item.course.title);
      }
    }
    return Array.from(mapa.entries()).map(([id, title]) => ({ id, title }));
  });

  readonly aulasDisponibles = computed(() => {
    const mapa = new Map<number, string>();
    for (const item of this.intentos()) {
      if (item.cohort?.id && item.cohort?.name) {
        mapa.set(item.cohort.id, item.cohort.name);
      }
    }
    return Array.from(mapa.entries()).map(([id, name]) => ({ id, name }));
  });

  readonly listaFiltrada = computed(() => {
    const estado = this.pestanaActiva() === 'pending' ? 'submitted' : 'evaluated';
    let res = this.intentos().filter((i) => i.status === estado);

    const cursoId = this.filtroCursoId();
    if (cursoId) {
      res = res.filter((i) => i.course?.id === cursoId);
    }

    const aulaId = this.filtroAulaId();
    if (aulaId) {
      res = res.filter((i) => i.cohort?.id === aulaId);
    }

    return res;
  });

  constructor() {
    this.cargarRevisiones();
  }

  cargarRevisiones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.docenteService
      .revisiones()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (resp) => {
          this.intentos.set((resp?.data as IntentoRevisionDto[]) || []);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Ocurrió un error al cargar la cola de revisiones.');
        },
      });
  }

  cambiarPestana(indice: number): void {
    this.pestanaActiva.set(indice === 0 ? 'pending' : 'reviewed');
  }

  abrirRevision(intento: IntentoRevisionDto): void {
    this.intentoSeleccionado.set(intento);
    this.errorModal.set(null);

    // Si ya tiene evaluación previa, prellenar los campos
    if (intento.status === 'evaluated') {
      this.formAprobado.set(intento.approved ?? true);
      this.formPuntaje.set(intento.score ?? null);
      const ultimoFb = intento.feedback && intento.feedback.length > 0
        ? intento.feedback[intento.feedback.length - 1]
        : null;
      this.formComentario.set(ultimoFb?.comment ?? '');
    } else {
      this.formAprobado.set(true);
      this.formPuntaje.set(null);
      this.formComentario.set('');
    }

    this.modalVisible.set(true);
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    this.intentoSeleccionado.set(null);
    this.errorModal.set(null);
  }

  guardarEvaluacion(): void {
    const intento = this.intentoSeleccionado();
    if (!intento || this.guardando()) return;

    this.guardando.set(true);
    this.errorModal.set(null);

    const payload = {
      aprobado: this.formAprobado(),
      puntaje: this.formPuntaje(),
      comentario: this.formComentario().trim() || null,
    };

    this.docenteService
      .evaluarIntento(intento.id, payload)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          this.feedbackMensaje.set(`La entrega de ${intento.student.name} fue evaluada correctamente.`);
          this.cerrarModal();
          this.cargarRevisiones();
          setTimeout(() => this.feedbackMensaje.set(null), 6000);
        },
        error: (err) => {
          this.errorModal.set(err?.error?.message || 'No fue posible guardar la evaluación. Intente nuevamente.');
        },
      });
  }

  obtenerEtiquetaTipo(tipo: string): string {
    switch (tipo) {
      case 'leccion':
      case 'lesson':
        return 'Lección';
      case 'practica':
      case 'practice':
        return 'Práctica';
      case 'mision':
      case 'mission':
        return 'Misión';
      case 'laboratorio':
      case 'lab':
        return 'Laboratorio';
      case 'evaluacion':
      case 'assessment':
        return 'Evaluación';
      case 'proyecto':
      case 'project':
        return 'Proyecto';
      case 'desafio':
      case 'challenge':
        return 'Desafío';
      default:
        return 'Actividad';
    }
  }

  obtenerColorTipo(tipo: string): string {
    switch (tipo) {
      case 'mision':
      case 'mission':
      case 'proyecto':
      case 'project':
        return 'orange';
      case 'laboratorio':
      case 'lab':
        return 'cyan';
      case 'evaluacion':
      case 'assessment':
        return 'purple';
      default:
        return 'blue';
    }
  }

  obtenerEtiquetaEvidencia(tipo: string): string {
    switch (tipo) {
      case 'lab_output':
        return 'Resultado de laboratorio';
      case 'mission_delivery':
        return 'Entrega de misión';
      case 'artifact':
        return 'Artefacto / Proyecto';
      case 'practice_result':
        return 'Resultado de práctica';
      case 'assessment_result':
        return 'Evaluación formativa';
      case 'submission':
        return 'Entrega de evidencia';
      default:
        return tipo;
    }
  }

  formatearClaveMetadato(clave: string): string {
    const formateadas: Record<string, string> = {
      tool: 'Herramienta utilizada',
      herramienta: 'Herramienta utilizada',
      classes: 'Número de clases entrenadas',
      problema: 'Problema definido',
      rol_humano: 'Rol humano–IA',
      limites_ia: 'Límites de la IA reconocidos',
      hipotesis: 'Hipótesis probada',
      enviado_desde: 'Origen del envío',
    };
    return formateadas[clave] || clave.replace(/_/g, ' ');
  }

  obtenerMetadatosKeys(metadata: Record<string, unknown> | null | undefined): string[] {
    return metadata ? Object.keys(metadata) : [];
  }

  criteriosRubrica(instructions: Record<string, unknown> | null | undefined): string[] {
    if (!instructions) return [];
    if (Array.isArray(instructions['rubrica_referencia'])) {
      return instructions['rubrica_referencia'] as string[];
    }
    return [];
  }

  obtenerCamposRequeridos(ins: Record<string, unknown> | null | undefined): string {
    if (!ins || !Array.isArray(ins['campos_requeridos'])) return '';
    return (ins['campos_requeridos'] as string[]).join(' • ');
  }

  obtenerPreguntasInforme(ins: Record<string, unknown> | null | undefined): string[] {
    if (!ins || !Array.isArray(ins['preguntas_informe'])) return [];
    return ins['preguntas_informe'] as string[];
  }
}
