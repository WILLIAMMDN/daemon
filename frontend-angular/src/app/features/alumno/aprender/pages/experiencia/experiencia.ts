import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { finalize, map } from 'rxjs';
import { ArcMiga, ArcPage } from '../../../../../shared/componentes/arc-page/arc-page';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import {
  ArtefactoAprendizajeDto,
  canonizarTipoExperiencia,
  CicloIntentosDto,
  ETIQUETA_TIPO_EXPERIENCIA,
  EvidenciaAprendizajeDto,
  ExperienciaAprendizajeDto,
  IntentoAprendizajeDto,
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
    DatePipe,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
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
  readonly numeroIntentoIniciado = signal<number | null>(null);
  readonly queCambio = signal('');
  readonly porQueCambio = signal('');
  readonly feedbackUtilizado = signal('');
  readonly artefactosBorrador = signal<ArtefactoAprendizajeDto[]>([]);
  readonly subiendoArchivo = signal(false);
  readonly errorArtefacto = signal<string | null>(null);
  readonly modalEnlaceVisible = signal(false);
  readonly enlaceUrl = signal('');
  readonly enlaceTitulo = signal('');

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

  readonly cicloIntentos = computed<CicloIntentosDto>(() => {
    const exp = this.experiencia();
    return exp?.attemptLifecycle ?? {
      state: 'notStarted',
      action: exp?.attemptable ? 'start' : 'none',
      canStartAttempt: Boolean(exp?.attemptable),
      canRevise: false,
      revisionAvailable: false,
      revisionExplanationRequired: false,
      activeAttemptId: null,
      activeAttemptNumber: null,
    };
  });

  readonly intentos = computed<IntentoAprendizajeDto[]>(() => this.experiencia()?.attempts ?? []);
  readonly ultimoIntento = computed<IntentoAprendizajeDto | null>(() => this.intentos().at(-1) ?? null);
  readonly intentoActivoId = computed(() => this.intentoIniciado() ?? this.cicloIntentos().activeAttemptId ?? null);
  readonly numeroIntentoActivo = computed(() => this.numeroIntentoIniciado() ?? this.cicloIntentos().activeAttemptNumber ?? null);
  readonly esRevision = computed(() => (this.numeroIntentoActivo() ?? 0) > 1);
  readonly intentoAnterior = computed<IntentoAprendizajeDto | null>(() => {
    const numero = this.numeroIntentoActivo();
    if (!numero || numero <= 1) return null;
    return [...this.intentos()].reverse().find((intento) => intento.number < numero) ?? null;
  });
  readonly explicacionRevisionCompleta = computed(() => {
    if (!this.esRevision() || !this.cicloIntentos().revisionExplanationRequired) return true;
    return Boolean(this.queCambio().trim() && this.porQueCambio().trim() && this.feedbackUtilizado().trim());
  });
  readonly puedeEnviarEvidencia = computed(() => Boolean(
    this.intentoActivoId()
      && (this.evidenciaTexto().trim() || this.artefactosBorrador().length > 0)
      && this.explicacionRevisionCompleta()
      && !this.procesando()
      && !this.subiendoArchivo(),
  ));

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
          this.numeroIntentoIniciado.set(intento.numero);
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

  etiquetaEstadoIntento(estado: string): string {
    switch (estado) {
      case 'started': return 'En progreso';
      case 'submitted': return 'Enviado';
      case 'evaluated': return 'Revisado';
      default: return estado;
    }
  }

  evidenciaPrincipal(intento: IntentoAprendizajeDto | null): EvidenciaAprendizajeDto | null {
    return intento?.evidence?.at(-1) ?? null;
  }

  versionesMetadata(evidencia: EvidenciaAprendizajeDto | null): Array<{ label: string; value: string }> {
    if (!evidencia?.metadata) return [];
    return Object.entries(evidencia.metadata)
      .filter(([key]) => /^v\d+$/i.test(key))
      .map(([key, value]) => ({ label: key.toUpperCase(), value: String(value) }));
  }

  criterioFeedback(...claves: string[]): string | null {
    const criterios = this.experiencia()?.latestFeedback?.criteria;
    if (!criterios || Array.isArray(criterios) || typeof criterios !== 'object') return null;
    for (const clave of claves) {
      const valor = criterios[clave];
      if (typeof valor === 'string' && valor.trim()) return valor;
    }
    return null;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const intentoId = this.intentoActivoId();
    if (!intentoId) {
      this.errorArtefacto.set('Debes tener un intento activo para adjuntar archivos.');
      input.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const permitidas = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    if (!ext || !permitidas.includes(ext)) {
      this.errorArtefacto.set('Formato de archivo no admitido. Se admiten PNG, JPG, WEBP y PDF.');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorArtefacto.set('El archivo supera el tamaño máximo permitido de 10 MB.');
      input.value = '';
      return;
    }

    this.subiendoArchivo.set(true);
    this.errorArtefacto.set(null);

    this.aprendizaje
      .subirArtefacto(intentoId, file)
      .pipe(finalize(() => {
        this.subiendoArchivo.set(false);
        input.value = '';
      }))
      .subscribe({
        next: (art) => {
          this.artefactosBorrador.update((list) => [...list, art]);
        },
        error: (err) => {
          this.errorArtefacto.set(err?.error?.message || 'Error al subir el archivo.');
        },
      });
  }

  abrirModalEnlace(): void {
    this.modalEnlaceVisible.set(true);
    this.enlaceUrl.set('');
    this.enlaceTitulo.set('');
    this.errorArtefacto.set(null);
  }

  cancelarModalEnlace(): void {
    this.modalEnlaceVisible.set(false);
  }

  guardarEnlace(): void {
    const intentoId = this.intentoActivoId();
    const url = this.enlaceUrl().trim();
    const titulo = this.enlaceTitulo().trim();

    if (!intentoId || !url) return;
    if (!url.startsWith('https://')) {
      this.errorArtefacto.set('El enlace debe iniciar con https://');
      return;
    }

    this.subiendoArchivo.set(true);
    this.errorArtefacto.set(null);

    this.aprendizaje
      .adjuntarEnlace(intentoId, url, titulo)
      .pipe(finalize(() => this.subiendoArchivo.set(false)))
      .subscribe({
        next: (art) => {
          this.artefactosBorrador.update((list) => [...list, art]);
          this.modalEnlaceVisible.set(false);
        },
        error: (err) => {
          this.errorArtefacto.set(err?.error?.message || 'Error al adjuntar el enlace.');
        },
      });
  }

  quitarArtefacto(art: ArtefactoAprendizajeDto): void {
    const intentoId = this.intentoActivoId();
    if (!intentoId) return;

    this.aprendizaje.eliminarArtefacto(intentoId, art.id).subscribe({
      next: () => {
        this.artefactosBorrador.update((list) => list.filter((a) => a.id !== art.id));
      },
      error: () => {
        this.artefactosBorrador.update((list) => list.filter((a) => a.id !== art.id));
      },
    });
  }

  formatearTamanio(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  entregarEvidencia(): void {
    const intentoId = this.intentoActivoId();
    const texto = this.evidenciaTexto().trim();
    if (!intentoId || (!texto && this.artefactosBorrador().length === 0) || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    this.feedback.set(null);

    const metadatos: Record<string, unknown> = { sentFrom: 'learning-experience-shell' };
    if (this.esRevision()) {
      metadatos['revision'] = {
        whatChanged: this.queCambio().trim(),
        whyChanged: this.porQueCambio().trim(),
        feedbackUsed: this.feedbackUtilizado().trim(),
      };
    }

    this.aprendizaje
      .entregarEvidencia(intentoId, {
        tipo: this.resolverTipoEvidencia(this.tipoCanonico()),
        referencia: texto || (this.artefactosBorrador().length > 0 ? 'Entrega con evidencias adjuntas.' : ''),
        artefacto_ids: this.artefactosBorrador().map((a) => a.id),
        metadatos,
      })
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('Tu evidencia fue enviada correctamente.');
          this.evidenciaTexto.set('');
          this.artefactosBorrador.set([]);
          this.queCambio.set('');
          this.porQueCambio.set('');
          this.feedbackUtilizado.set('');
          this.intentoIniciado.set(null);
          this.numeroIntentoIniciado.set(null);
          this.aprendizaje.cargarMapa(true).subscribe({ error: () => undefined });
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Ocurrió un problema al enviar la evidencia.');
        },
      });
  }
}
