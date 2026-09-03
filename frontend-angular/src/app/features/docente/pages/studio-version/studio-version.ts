import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  CatalogoStudio,
  ExperienciaDetalle,
  ExperienciaPayload,
  HitoDetalle,
  ModalidadEvidencia,
  ModoCompletitud,
  RutaDetalle,
  TipoExperiencia,
  VersionDetalle,
} from '../../models/studio.model';
import { ErrorStudio, clasificarError, mensajeDeError } from '../../services/studio-errores';
import { Studio } from '../../services/studio.service';
import {
  ETIQUETAS_BLOQUE,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODO,
  ETIQUETAS_TIPO,
  etiqueta,
} from './studio-etiquetas';

interface FilaCriterio {
  codigo: string;
  titulo: string;
  descripcion: string;
}

interface FilaBloque {
  type: string;
  title: string;
  text: string;
  itemsTexto: string;
  itemsKey: string | null;
  extras: Record<string, unknown> | null;
}

/**
 * Editor de una versión de curso.
 *
 * Es un cliente delgado de la API canónica de autoría: no valida la ruta, no
 * detecta ciclos y no decide si algo puede publicarse. Muestra el árbol que
 * devuelve el backend, envía mutaciones a los contratos canónicos y refleja el
 * resultado de la validación de servidor. Cuando la versión está publicada,
 * simplemente no hay acciones de mutación.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-studio-version',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzCheckboxModule,
    NzDrawerModule,
    NzEmptyModule,
    NzInputModule,
    NzModalModule,
    NzPopconfirmModule,
    NzResultModule,
    NzSelectModule,
    NzSkeletonModule,
    NzTabsModule,
    NzTagModule,
  ],
  templateUrl: './studio-version.html',
  styleUrl: './studio-version.scss',
})
export class StudioVersion {
  private readonly studio = inject(Studio);
  private readonly fb = inject(FormBuilder);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly destruccion = inject(DestroyRef);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  private readonly parametros = toSignal(this.rutaActiva.paramMap, {
    initialValue: this.rutaActiva.snapshot.paramMap,
  });
  readonly courseId = computed(() => this.parametros().get('courseId') ?? '');
  readonly versionId = computed(() => this.parametros().get('versionId') ?? '');

  readonly detalle = signal<VersionDetalle | null>(null);
  readonly catalogo = signal<CatalogoStudio | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly publicando = signal(false);
  readonly error = signal<ErrorStudio | null>(null);

  readonly ruta = computed<RutaDetalle | null>(() => this.detalle()?.paths[0] ?? null);
  readonly editable = computed(() => this.detalle()?.editable ?? false);
  readonly validacion = computed(() => this.detalle()?.validation ?? null);
  readonly listoParaPublicar = computed(() => this.editable() && (this.validacion()?.ready ?? false));

  readonly totalExperiencias = computed(
    () => this.ruta()?.milestones.reduce((total, hito) => total + hito.experiences.length, 0) ?? 0,
  );

  /** Hitos disponibles como prerrequisito del hito en edición. */
  readonly candidatosPrerrequisito = computed(() => {
    const enEdicion = this.hitoEditando();
    return (this.ruta()?.milestones ?? []).filter((hito) => hito.id !== enEdicion?.id);
  });

  /* --- Formularios --- */

  readonly formMetadatos = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(5000)],
    audiencia: ['TEENS', Validators.required],
    etapa: ['inicial', Validators.required],
  });

  readonly formHito = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(5000)],
    orden: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    obligatorio: [true],
    prerrequisitos: this.fb.nonNullable.control<number[]>([]),
  });

  readonly formExperiencia = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(5000)],
    tipo: this.fb.nonNullable.control<TipoExperiencia>('leccion', Validators.required),
    orden: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    obligatoria: [true],
    permiteIntentos: [true],
    maxIntentos: this.fb.control<number | null>(null),
    idUnidad: this.fb.control<number | null>(null),
    modo: this.fb.control<string | null>('submission'),
    puntajeMinimo: this.fb.control<number | null>(null),
    revisionHumana: this.fb.control<boolean | null>(null),
    objetivos: this.fb.nonNullable.control<number[]>([]),
    modalidades: this.fb.nonNullable.control<ModalidadEvidencia[]>([]),
    evidenciaObligatoria: [true],
    minimoArtefactos: [0],
    notasEvidencia: [''],
    rubricaTitulo: [''],
    resumenContenido: [''],
  });

  /**
   * Ancho de los drawers de autoría.
   *
   * NG-ZORRO calcula la traslación de apertura a partir de `nzWidth`, así que
   * tiene que ser un número: una expresión CSS como `min(620px, 100%)` deja el
   * panel fuera de la pantalla. Se acota al viewport para que en móvil el
   * formulario siga siendo alcanzable.
   */
  private readonly anchoVentana = signal(typeof window === 'undefined' ? 1440 : window.innerWidth);
  readonly anchoDrawerHito = computed(() => Math.min(480, this.anchoVentana()));
  readonly anchoDrawerExperiencia = computed(() => Math.min(620, this.anchoVentana()));

  readonly criterios = signal<FilaCriterio[]>([]);
  readonly bloques = signal<FilaBloque[]>([]);

  readonly hitoDrawer = signal(false);
  readonly experienciaDrawer = signal(false);
  readonly hitoEditando = signal<HitoDetalle | null>(null);
  readonly hitoDeExperiencia = signal<HitoDetalle | null>(null);
  readonly experienciaEditando = signal<ExperienciaDetalle | null>(null);

  readonly etiquetaTipo = (tipo: string): string => etiqueta(ETIQUETAS_TIPO, tipo);
  readonly etiquetaModalidad = (modalidad: string): string => etiqueta(ETIQUETAS_MODALIDAD, modalidad);
  readonly etiquetaModo = (modo: string | null): string => (modo ? etiqueta(ETIQUETAS_MODO, modo) : 'Sin regla');
  readonly etiquetaBloque = (tipo: string): string => etiqueta(ETIQUETAS_BLOQUE, tipo);

  constructor() {
    if (typeof window !== 'undefined') {
      const alRedimensionar = (): void => this.anchoVentana.set(window.innerWidth);
      window.addEventListener('resize', alRedimensionar);
      this.destruccion.onDestroy(() => window.removeEventListener('resize', alRedimensionar));
    }

    this.studio.catalogo().subscribe({
      next: (catalogo) => this.catalogo.set(catalogo),
      error: () => this.catalogo.set(null),
    });

    // El componente se reutiliza al navegar entre versiones del mismo curso.
    effect(() => {
      const id = this.versionId();
      if (id) {
        this.cargar();
      }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.studio.version(Number(this.versionId())).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
        this.formMetadatos.reset({
          titulo: detalle.version.title ?? '',
          descripcion: detalle.version.description ?? '',
          audiencia: detalle.version.audience ?? 'TEENS',
          etapa: detalle.version.difficulty ?? 'inicial',
        });
        if (!detalle.editable) {
          this.formMetadatos.disable({ emitEvent: false });
        } else {
          this.formMetadatos.enable({ emitEvent: false });
        }
      },
      error: (fallo) => {
        this.cargando.set(false);
        this.detalle.set(null);
        this.error.set(clasificarError(fallo, 'No pudimos cargar esta versión.'));
      },
    });
  }

  /* --- Metadatos --- */

  guardarMetadatos(): void {
    if (this.formMetadatos.invalid) {
      this.formMetadatos.markAllAsTouched();
      return;
    }

    const valores = this.formMetadatos.getRawValue();
    this.guardando.set(true);

    this.studio
      .actualizarMetadatos(Number(this.versionId()), {
        titulo: valores.titulo.trim() || null,
        descripcion: valores.descripcion.trim() || null,
        audiencia: valores.audiencia,
        etapa: valores.etapa,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.message.success('Metadatos actualizados.');
          this.cargar();
        },
        error: (fallo) => this.fallarMutacion(fallo, 'No se pudieron guardar los metadatos.'),
      });
  }

  /* --- Hitos --- */

  abrirCreacionHito(): void {
    this.hitoEditando.set(null);
    this.formHito.reset({
      titulo: '',
      descripcion: '',
      orden: (this.ruta()?.milestones.length ?? 0) + 1,
      obligatorio: true,
      prerrequisitos: [],
    });
    this.hitoDrawer.set(true);
  }

  abrirEdicionHito(hito: HitoDetalle): void {
    this.hitoEditando.set(hito);
    this.formHito.reset({
      titulo: hito.title,
      descripcion: hito.description ?? '',
      orden: hito.order,
      obligatorio: hito.required,
      prerrequisitos: [...hito.prerequisiteIds],
    });
    this.hitoDrawer.set(true);
  }

  cerrarHito(): void {
    this.hitoDrawer.set(false);
    this.hitoEditando.set(null);
  }

  guardarHito(): void {
    const ruta = this.ruta();
    if (!ruta || this.formHito.invalid) {
      this.formHito.markAllAsTouched();
      return;
    }

    const valores = this.formHito.getRawValue();
    const payload = {
      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim() || null,
      orden: valores.orden,
      obligatorio: valores.obligatorio,
    };

    const enEdicion = this.hitoEditando();
    this.guardando.set(true);

    const peticion = enEdicion
      ? this.studio.actualizarHito(enEdicion.id, payload)
      : this.studio.crearHito(ruta.id, payload);

    peticion.subscribe({
      next: (respuesta) => {
        const hitoId = enEdicion?.id ?? (respuesta as { id?: number })?.id;
        if (!hitoId) {
          this.terminarMutacion('Hito guardado.');
          return;
        }
        // Los prerrequisitos son un contrato aparte: el backend valida
        // pertenencia a la ruta y ausencia de ciclos.
        this.studio.prerrequisitos(hitoId, valores.prerrequisitos).subscribe({
          next: () => this.terminarMutacion('Hito guardado.'),
          error: (fallo) => this.fallarMutacion(fallo, 'El hito se guardó, pero los prerrequisitos fueron rechazados.'),
        });
      },
      error: (fallo) => this.fallarMutacion(fallo, 'No se pudo guardar el hito.'),
    });
  }

  eliminarHito(hito: HitoDetalle): void {
    this.guardando.set(true);
    this.studio.eliminarHito(hito.id).subscribe({
      next: () => this.terminarMutacion('Hito eliminado.'),
      error: (fallo) => this.fallarMutacion(fallo, 'No se pudo eliminar el hito.'),
    });
  }

  /* --- Experiencias --- */

  abrirCreacionExperiencia(hito: HitoDetalle): void {
    this.hitoDeExperiencia.set(hito);
    this.experienciaEditando.set(null);
    this.formExperiencia.reset({
      titulo: '',
      descripcion: '',
      tipo: 'leccion',
      orden: hito.experiences.length + 1,
      obligatoria: true,
      permiteIntentos: true,
      maxIntentos: null,
      idUnidad: null,
      modo: 'submission',
      puntajeMinimo: null,
      revisionHumana: null,
      objetivos: [],
      modalidades: [],
      evidenciaObligatoria: true,
      minimoArtefactos: 0,
      notasEvidencia: '',
      rubricaTitulo: '',
      resumenContenido: '',
    });
    this.criterios.set([]);
    this.bloques.set([]);
    this.experienciaDrawer.set(true);
  }

  abrirEdicionExperiencia(hito: HitoDetalle, experiencia: ExperienciaDetalle): void {
    this.hitoDeExperiencia.set(hito);
    this.experienciaEditando.set(experiencia);
    this.formExperiencia.reset({
      titulo: experiencia.title,
      descripcion: experiencia.description ?? '',
      tipo: experiencia.type,
      orden: experiencia.order,
      obligatoria: experiencia.required,
      permiteIntentos: experiencia.attemptable,
      maxIntentos: experiencia.maxAttempts,
      idUnidad: experiencia.unitId,
      modo: experiencia.completion.mode,
      puntajeMinimo: experiencia.completion.passingScore,
      revisionHumana: experiencia.review.source === 'explicit' ? experiencia.review.required : null,
      objetivos: [...experiencia.objectiveIds],
      modalidades: [...experiencia.evidence.modalities],
      evidenciaObligatoria: experiencia.evidence.required,
      minimoArtefactos: experiencia.evidence.minimumArtifacts,
      notasEvidencia: experiencia.evidence.notes ?? '',
      rubricaTitulo: experiencia.rubric?.title ?? '',
      resumenContenido: experiencia.content.summary ?? '',
    });
    this.criterios.set(
      (experiencia.rubric?.criteria ?? []).map((criterio) => ({
        codigo: criterio.code,
        titulo: criterio.title,
        descripcion: criterio.description ?? '',
      })),
    );
    this.bloques.set(
      experiencia.content.blocks.map((bloque) => ({
        type: bloque.type,
        title: bloque.title ?? '',
        text: bloque.text ?? '',
        itemsTexto: bloque.items.join('\n'),
        itemsKey: bloque.itemsKey,
        extras: bloque.extras,
      })),
    );
    this.experienciaDrawer.set(true);
  }

  cerrarExperiencia(): void {
    this.experienciaDrawer.set(false);
    this.experienciaEditando.set(null);
    this.hitoDeExperiencia.set(null);
  }

  agregarCriterio(): void {
    this.criterios.update((filas) => [
      ...filas,
      { codigo: `C${filas.length + 1}`, titulo: '', descripcion: '' },
    ]);
  }

  quitarCriterio(indice: number): void {
    this.criterios.update((filas) => filas.filter((_, i) => i !== indice));
  }

  actualizarCriterio(indice: number, campo: keyof FilaCriterio, valor: string): void {
    this.criterios.update((filas) =>
      filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );
  }

  agregarBloque(): void {
    this.bloques.update((filas) => [
      ...filas,
      { type: 'concepto', title: '', text: '', itemsTexto: '', itemsKey: null, extras: null },
    ]);
  }

  quitarBloque(indice: number): void {
    this.bloques.update((filas) => filas.filter((_, i) => i !== indice));
  }

  actualizarBloque(indice: number, campo: keyof FilaBloque, valor: string): void {
    this.bloques.update((filas) =>
      filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );
  }

  guardarExperiencia(): void {
    const hito = this.hitoDeExperiencia();
    if (!hito || this.formExperiencia.invalid) {
      this.formExperiencia.markAllAsTouched();
      return;
    }

    const valores = this.formExperiencia.getRawValue();
    const enEdicion = this.experienciaEditando();

    // La guía de entrega conserva las claves pedagógicas históricas: sólo se
    // reemplazan las dos claves canónicas que Studio edita.
    const guia: Record<string, unknown> = { ...(enEdicion?.deliveryGuide ?? {}) };
    guia['evidencia'] = {
      modalidades: valores.modalidades,
      obligatoria: valores.evidenciaObligatoria,
      minimo_artefactos: valores.minimoArtefactos ?? 0,
      notas: valores.notasEvidencia.trim() || null,
    };

    const criterios = this.criterios()
      .filter((fila) => fila.titulo.trim() !== '')
      .map((fila, indice) => ({
        codigo: fila.codigo.trim() || `C${indice + 1}`,
        titulo: fila.titulo.trim(),
        descripcion: fila.descripcion.trim() || null,
      }));

    if (criterios.length > 0) {
      guia['rubrica'] = { titulo: valores.rubricaTitulo.trim() || null, criterios };
    } else {
      delete guia['rubrica'];
    }

    const bloques = this.bloques()
      .filter((fila) => fila.text.trim() !== '' || fila.itemsTexto.trim() !== '' || fila.title.trim() !== '')
      .map((fila) => ({
        type: fila.type,
        title: fila.title.trim() || null,
        text: fila.text.trim() || null,
        items: fila.itemsTexto
          .split('\n')
          .map((item) => item.trim())
          .filter((item) => item !== ''),
        itemsKey: fila.itemsKey,
        extras: fila.extras,
      }));

    const payload: ExperienciaPayload = {
      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim() || null,
      tipo: valores.tipo,
      orden: valores.orden,
      obligatoria: valores.obligatoria,
      permite_intentos: valores.permiteIntentos,
      max_intentos: valores.maxIntentos,
      id_unidad: valores.idUnidad,
      regla_completitud: {
        modo: (valores.modo as ModoCompletitud | null) ?? null,
        puntaje_minimo: valores.puntajeMinimo,
        revision_humana: valores.revisionHumana,
      },
      guia_entrega: guia,
      contenido: {
        summary: valores.resumenContenido.trim() || null,
        blocks: bloques,
      },
      objetivos: valores.objetivos,
    };

    this.guardando.set(true);

    const peticion = enEdicion
      ? this.studio.actualizarExperiencia(enEdicion.id, payload)
      : this.studio.crearExperiencia(hito.id, payload);

    peticion.subscribe({
      next: () => this.terminarMutacion(enEdicion ? 'Experiencia actualizada.' : 'Experiencia creada.'),
      error: (fallo) => this.fallarMutacion(fallo, 'No se pudo guardar la experiencia.'),
    });
  }

  eliminarExperiencia(experiencia: ExperienciaDetalle): void {
    this.guardando.set(true);
    this.studio.eliminarExperiencia(experiencia.id).subscribe({
      next: () => this.terminarMutacion('Experiencia eliminada.'),
      error: (fallo) => this.fallarMutacion(fallo, 'No se pudo eliminar la experiencia.'),
    });
  }

  /* --- Validación y publicación --- */

  revalidar(): void {
    this.studio.validacion(Number(this.versionId())).subscribe({
      next: (validacion) => {
        const actual = this.detalle();
        if (actual) {
          this.detalle.set({ ...actual, validation: validacion });
        }
        this.message.info(
          validacion.ready
            ? 'La versión está lista para publicarse.'
            : `La versión tiene ${validacion.errors.length} error(es) de publicación.`,
        );
      },
      error: (fallo) => this.message.error(mensajeDeError(fallo, 'No se pudo validar la versión.')),
    });
  }

  confirmarPublicacion(): void {
    const detalle = this.detalle();
    if (!detalle) {
      return;
    }

    this.modal.confirm({
      nzTitle: `¿Publicar V${detalle.version.number}?`,
      nzContent:
        'Al publicar, esta versión queda inmutable y deja de poder editarse. Las cohortes ya matriculadas siguen en su versión actual; para cambiar algo después habrá que crear un borrador nuevo.',
      nzOkText: 'Publicar versión',
      nzOkDanger: false,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.publicar(),
    });
  }

  private publicar(): void {
    this.publicando.set(true);

    this.studio.publicar(Number(this.versionId())).subscribe({
      next: (detalle) => {
        this.publicando.set(false);
        this.detalle.set(detalle);
        this.formMetadatos.disable({ emitEvent: false });
        this.message.success(`Versión V${detalle.version.number} publicada.`);
      },
      error: (fallo) => {
        this.publicando.set(false);
        const validacion = (fallo as { error?: { validation?: VersionDetalle['validation'] } })?.error?.validation;
        const actual = this.detalle();
        if (validacion && actual) {
          this.detalle.set({ ...actual, validation: validacion });
        }
        this.message.error(mensajeDeError(fallo, 'No se pudo publicar la versión.'));
      },
    });
  }

  private terminarMutacion(mensaje: string): void {
    this.guardando.set(false);
    this.message.success(mensaje);
    this.cerrarHito();
    this.cerrarExperiencia();
    this.cargar();
  }

  private fallarMutacion(fallo: unknown, porDefecto: string): void {
    this.guardando.set(false);
    this.message.error(mensajeDeError(fallo, porDefecto));
  }
}
