import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { CatalogoStudio, VersionDetalle } from '../../models/studio.model';
import { StudioVersion } from './studio-version';

const CATALOGO: CatalogoStudio = {
  experienceTypes: ['leccion', 'practica', 'mision', 'laboratorio', 'evaluacion', 'proyecto', 'desafio'],
  audiences: ['KIDS', 'TEENS', 'TODOS'],
  difficulties: ['inicial', 'intermedia', 'avanzada'],
  evidenceModalities: ['text', 'structured', 'image', 'pdf', 'external_link'],
  artifactModalities: ['image', 'pdf', 'external_link'],
  completionModes: ['manual_review', 'passing_score', 'submission', 'lesson_completion'],
  contentBlockTypes: ['concepto', 'ejemplo', 'instrucciones', 'pasos', 'pregunta', 'reflexion', 'criterios_exito'],
  objectives: [],
};

const OBJETIVO_1 = {
  id: 41,
  code: 'AI-01',
  description: 'Comprender mecanismos fundamentales de la IA.',
  framework: 'DAEMON_ARC',
  level: 'TEENS',
};

const OBJETIVO_2 = {
  id: 42,
  code: 'AI-02',
  description: 'Dirigir y especificar tareas para IA generativa.',
  framework: 'DAEMON_ARC',
  level: 'TEENS',
};

const EXPERIENCIA = {
  id: 301,
  uuid: 'uuid-e1',
  milestoneId: 201,
  unitId: 101,
  type: 'laboratorio' as const,
  variant: null,
  title: 'Entrena, prueba y rompe un modelo simple',
  description: 'Experimenta con clasificación visual.',
  order: 1,
  required: true,
  attemptable: true,
  maxAttempts: null,
  sourceType: null,
  sourceId: null,
  status: 'draft',
  completion: { mode: 'submission' as const, passingScore: null },
  review: { required: true, source: 'derivedFromType' as const },
  evidence: {
    modalities: ['text' as const, 'image' as const],
    required: true,
    minimumArtifacts: 1,
    notes: null,
    configured: true,
  },
  rubric: {
    title: 'Rúbrica del laboratorio',
    criteria: [{ code: 'C1', title: 'Registro del experimento', description: null }],
    legacy: false,
  },
  deliveryGuide: { instrucciones: 'Registra tus conclusiones.' },
  content: {
    format: 'structured' as const,
    summary: null,
    blocks: [{ type: 'concepto', title: null, text: 'La IA no es magia.', items: [], itemsKey: null, extras: null }],
    raw: null,
  },
  objectiveIds: [41],
  objectives: [OBJETIVO_1],
};

const BORRADOR: VersionDetalle = {
  course: { id: 20, title: 'IA: Origen', code: 'IA-ORIGEN-TEENS', level: 'TEENS', status: 'published' },
  version: {
    id: 6,
    uuid: 'uuid-v2',
    courseId: 20,
    number: 2,
    title: 'IA_ORIGEN_TEENS_2026_V2',
    description: 'Segunda edición.',
    audience: 'TEENS',
    difficulty: 'inicial',
    status: 'draft',
    editable: true,
    publishedAt: null,
    archivedAt: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    clonedFromVersionId: 5,
    author: { id: 3, name: 'Ana Autora' },
    publisher: null,
    pathCount: 1,
  },
  editable: true,
  units: [
    {
      id: 101,
      title: 'Unidad 1: ¿La IA piensa?',
      description: null,
      order: 1,
      status: 'draft',
      lessons: [{ id: 1001, title: 'IA no es magia', order: 1, status: 'draft' }],
    },
  ],
  paths: [
    {
      id: 90,
      title: 'IA: Origen',
      description: 'Ruta troncal.',
      audience: 'TEENS',
      difficulty: 'inicial',
      status: 'draft',
      editable: true,
      milestones: [
        {
          id: 201,
          title: '¿La IA piensa?',
          description: 'Desarma el pensamiento mágico.',
          order: 1,
          required: true,
          prerequisiteIds: [],
          experiences: [EXPERIENCIA],
        },
        {
          id: 202,
          title: '¿Por qué la IA responde eso?',
          description: null,
          order: 2,
          required: true,
          prerequisiteIds: [201],
          experiences: [],
        },
      ],
    },
  ],
  objectives: [OBJETIVO_1, OBJETIVO_2],
  validation: {
    versionId: 6,
    ready: true,
    errors: [],
    warnings: [
      {
        code: 'experience.evidence_unconfigured',
        scope: 'experience',
        message: 'La experiencia «X» pide entrega pero no declara modalidades de evidencia.',
        targetId: 301,
      },
    ],
    checkedAt: '2026-09-03T12:00:00Z',
  },
  generatedAt: '2026-09-03T12:00:00Z',
};

const PUBLICADA: VersionDetalle = {
  ...BORRADOR,
  version: { ...BORRADOR.version, id: 5, number: 1, status: 'published', editable: false, publishedAt: '2026-08-01T00:00:00Z' },
  editable: false,
  paths: [{ ...BORRADOR.paths[0], status: 'published', editable: false }],
  validation: {
    versionId: 5,
    ready: false,
    errors: [
      { code: 'version.not_draft', scope: 'version', message: 'Sólo una versión en borrador puede publicarse.', targetId: 5 },
    ],
    warnings: [],
    checkedAt: '2026-09-03T12:00:00Z',
  },
};

interface ConfirmacionCapturada {
  nzTitle: string;
  nzOnOk: () => void;
}

describe('DAEMON ARC — Studio course version editor', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<StudioVersion>;
  let confirmaciones: ConfirmacionCapturada[];

  const configurar = (versionId: string): void => {
    confirmaciones = [];
    TestBed.configureTestingModule({
      imports: [StudioVersion],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzI18n(es_ES),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ courseId: '20', versionId })),
            snapshot: { paramMap: convertToParamMap({ courseId: '20', versionId }) },
          },
        },
      ],
    });

    // El componente importa NzModalModule, así que NzModalService resuelve
    // desde su propio injector: el doble tiene que vivir ahí para ganar.
    // Se captura la confirmación para probar que publicar exige un acto
    // deliberado y no ocurre al abrir el diálogo.
    TestBed.overrideComponent(StudioVersion, {
      add: {
        providers: [
          {
            provide: NzModalService,
            useValue: {
              confirm: (opciones: ConfirmacionCapturada) => {
                confirmaciones.push(opciones);
                return { close: () => undefined };
              },
            },
          },
        ],
      },
    });

    httpMock = TestBed.inject(HttpTestingController);
  };

  const crear = (): ComponentFixture<StudioVersion> => {
    const creada = TestBed.createComponent(StudioVersion);
    creada.detectChanges();
    return creada;
  };

  const responder = (detalle: VersionDetalle): void => {
    httpMock.expectOne((peticion) => peticion.url.includes('/academico/studio/catalogo')).flush(CATALOGO);
    httpMock
      .expectOne((peticion) => peticion.url.includes(`/academico/studio/versiones/${detalle.version.id}`))
      .flush(detalle);
    fixture.detectChanges();
  };

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // El resto de la suite sustituye NzModalService para poder disparar la
  // confirmación; esta prueba usa los proveedores reales para que un modulo
  // NG-ZORRO ausente en `imports` falle aquí y no sólo en el navegador.
  it('resolves every NG-ZORRO dependency from its own imports', () => {
    confirmaciones = [];
    TestBed.configureTestingModule({
      imports: [StudioVersion],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzI18n(es_ES),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ courseId: '20', versionId: '6' })),
            snapshot: { paramMap: convertToParamMap({ courseId: '20', versionId: '6' }) },
          },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    // `inject(NzModalService)` es un campo de clase: si faltara NzModalModule
    // en los imports del componente, createComponent lanzaría NullInjector.
    expect(() => {
      fixture = crear();
    }).not.toThrow();
    responder(BORRADOR);

    expect(fixture.componentInstance.editable()).toBe(true);
  });

  it('shows a skeleton while the version tree loads', () => {
    configurar('6');
    fixture = crear();

    expect(fixture.nativeElement.querySelector('nz-skeleton')).toBeTruthy();
    responder(BORRADOR);
  });

  it('renders the real path with milestones, experiences and objectives', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('¿La IA piensa?');
    expect(texto).toContain('¿Por qué la IA responde eso?');
    expect(texto).toContain('Entrena, prueba y rompe un modelo simple');
    expect(texto).toContain('Laboratorio');
    expect(texto).toContain('AI-01');
    expect(texto).toContain('Hito #201');
    expect(fixture.componentInstance.totalExperiencias()).toBe(1);
  });

  it('shows the configured evidence modalities and the rubric size', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Texto');
    expect(texto).toContain('Imagen');
    expect(texto).toContain('Rúbrica de 1 criterio(s)');
    expect(texto).toContain('Revisión docente');
  });

  it('surfaces server validation warnings without blocking publication', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('1 recomendación(es)');
    expect(texto).toContain('no declara modalidades de evidencia');
    expect(fixture.componentInstance.listoParaPublicar()).toBe(true);
  });

  it('blocks publication while the server reports errors', () => {
    configurar('6');
    fixture = crear();
    responder({
      ...BORRADOR,
      validation: {
        versionId: 6,
        ready: false,
        errors: [
          {
            code: 'milestone.no_required_experience',
            scope: 'milestone',
            message: 'El hito obligatorio «¿Por qué la IA responde eso?» necesita al menos una experiencia obligatoria.',
            targetId: 202,
          },
        ],
        warnings: [],
        checkedAt: '2026-09-03T12:00:00Z',
      },
    });

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('1 bloqueo(s) de publicación');
    expect(texto).toContain('necesita al menos una experiencia obligatoria');
    expect(fixture.componentInstance.listoParaPublicar()).toBe(false);

    const publicar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((boton) => boton.textContent?.includes('Publicar versión'));
    expect(publicar?.disabled).toBe(true);
  });

  it('renders a published version read-only with no mutation actions', () => {
    configurar('5');
    fixture = crear();
    responder(PUBLICADA);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Versión publicada — sólo lectura');
    expect(fixture.componentInstance.editable()).toBe(false);

    const etiquetas = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).map((boton) => boton.textContent?.trim() ?? '');

    expect(etiquetas.some((etiqueta) => etiqueta.includes('Publicar versión'))).toBe(false);
    expect(etiquetas.some((etiqueta) => etiqueta.includes('Añadir hito'))).toBe(false);
    expect(etiquetas.some((etiqueta) => etiqueta.includes('Añadir experiencia'))).toBe(false);
    expect(etiquetas.some((etiqueta) => etiqueta.includes('Eliminar'))).toBe(false);
    // La validación de una versión publicada no se presenta como bloqueo.
    expect(texto).not.toContain('bloqueo(s) de publicación');
  });

  it('sends metadata to the canonical version contract', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    fixture.componentInstance.formMetadatos.setValue({
      titulo: 'IA_ORIGEN_TEENS_2026_V2',
      descripcion: 'Segunda edición revisada.',
      audiencia: 'TEENS',
      etapa: 'intermedia',
    });
    fixture.componentInstance.guardarMetadatos();

    const peticion = httpMock.expectOne((llamada) => llamada.url.includes('/academico/versiones/6'));
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({
      titulo: 'IA_ORIGEN_TEENS_2026_V2',
      descripcion: 'Segunda edición revisada.',
      audiencia: 'TEENS',
      etapa: 'intermedia',
    });
    peticion.flush({});

    // La página se recarga desde el servidor tras la mutación.
    httpMock.expectOne((llamada) => llamada.url.includes('/academico/studio/versiones/6')).flush(BORRADOR);
    fixture.detectChanges();
  });

  it('creates an experience through the canonical milestone contract with evidence and content', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const componente = fixture.componentInstance;
    componente.abrirCreacionExperiencia(BORRADOR.paths[0].milestones[1]);
    componente.formExperiencia.patchValue({
      titulo: 'Mejora la instrucción',
      descripcion: 'Diagnostica y reescribe.',
      tipo: 'practica',
      orden: 1,
      modo: 'submission',
      objetivos: [42],
      modalidades: ['text', 'external_link'],
      minimoArtefactos: 1,
    });
    componente.agregarBloque();
    componente.actualizarBloque(0, 'text', 'Una instrucción verificable declara criterios de éxito.');
    componente.agregarCriterio();
    componente.actualizarCriterio(0, 'titulo', 'Claridad de la instrucción');
    componente.guardarExperiencia();

    const peticion = httpMock.expectOne((llamada) =>
      llamada.url.includes('/academico/hitos/202/experiencias'),
    );
    expect(peticion.request.method).toBe('POST');

    const cuerpo = peticion.request.body;
    expect(cuerpo.tipo).toBe('practica');
    expect(cuerpo.titulo).toBe('Mejora la instrucción');
    expect(cuerpo.objetivos).toEqual([42]);
    expect(cuerpo.regla_completitud.modo).toBe('submission');
    expect(cuerpo.guia_entrega.evidencia.modalidades).toEqual(['text', 'external_link']);
    expect(cuerpo.guia_entrega.evidencia.minimo_artefactos).toBe(1);
    expect(cuerpo.guia_entrega.rubrica.criterios[0].titulo).toBe('Claridad de la instrucción');
    expect(cuerpo.contenido.blocks[0].text).toBe('Una instrucción verificable declara criterios de éxito.');
    peticion.flush({ id: 999 });

    httpMock.expectOne((llamada) => llamada.url.includes('/academico/studio/versiones/6')).flush(BORRADOR);
    fixture.detectChanges();
  });

  it('preserves the legacy pedagogical keys of an edited experience delivery guide', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const componente = fixture.componentInstance;
    componente.abrirEdicionExperiencia(BORRADOR.paths[0].milestones[0], EXPERIENCIA);
    componente.formExperiencia.patchValue({ titulo: 'Laboratorio revisado' });
    componente.guardarExperiencia();

    const peticion = httpMock.expectOne((llamada) => llamada.url.includes('/academico/experiencias/301'));
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body.guia_entrega.instrucciones).toBe('Registra tus conclusiones.');
    expect(peticion.request.body.guia_entrega.evidencia.modalidades).toEqual(['text', 'image']);
    expect(peticion.request.body.objetivos).toEqual([41]);
    peticion.flush({});

    httpMock.expectOne((llamada) => llamada.url.includes('/academico/studio/versiones/6')).flush(BORRADOR);
    fixture.detectChanges();
  });

  it('sends milestone prerequisites to the canonical dependency contract', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const componente = fixture.componentInstance;
    componente.abrirEdicionHito(BORRADOR.paths[0].milestones[1]);
    componente.formHito.patchValue({ prerrequisitos: [201] });
    componente.guardarHito();

    httpMock.expectOne((llamada) => llamada.url.includes('/academico/hitos/202')).flush({ id: 202 });
    const dependencias = httpMock.expectOne((llamada) =>
      llamada.url.includes('/academico/hitos/202/prerrequisitos'),
    );
    expect(dependencias.request.method).toBe('PUT');
    expect(dependencias.request.body).toEqual({ prerrequisitos: [201] });
    dependencias.flush({});

    httpMock.expectOne((llamada) => llamada.url.includes('/academico/studio/versiones/6')).flush(BORRADOR);
    fixture.detectChanges();
  });

  it('surfaces a server-rejected prerequisite cycle instead of deciding locally', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    const componente = fixture.componentInstance;
    componente.abrirEdicionHito(BORRADOR.paths[0].milestones[0]);
    componente.formHito.patchValue({ prerrequisitos: [202] });
    componente.guardarHito();

    httpMock.expectOne((llamada) => llamada.url.includes('/academico/hitos/201')).flush({ id: 201 });
    httpMock
      .expectOne((llamada) => llamada.url.includes('/academico/hitos/201/prerrequisitos'))
      .flush(
        { message: 'Los prerrequisitos forman un ciclo.' },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    fixture.detectChanges();

    expect(componente.guardando()).toBe(false);
  });

  it('refreshes the authoritative validation on demand', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    fixture.componentInstance.revalidar();

    const peticion = httpMock.expectOne((llamada) =>
      llamada.url.includes('/academico/studio/versiones/6/validacion'),
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush({
      versionId: 6,
      ready: false,
      errors: [
        { code: 'path.prerequisite_cycle', scope: 'path', message: 'Los prerrequisitos forman un ciclo.', targetId: 90 },
      ],
      warnings: [],
      checkedAt: '2026-09-03T12:05:00Z',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string)).toContain('Los prerrequisitos forman un ciclo.');
    expect(fixture.componentInstance.listoParaPublicar()).toBe(false);
  });

  it('publishes only after an explicit confirmation and then switches to read-only', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    // La confirmación es deliberada: nada viaja al servidor hasta aceptarla.
    fixture.componentInstance.confirmarPublicacion();
    httpMock.expectNone((llamada) => llamada.url.includes('/publicacion'));
    expect(confirmaciones).toHaveLength(1);
    expect(confirmaciones[0].nzTitle).toContain('¿Publicar V2?');

    confirmaciones[0].nzOnOk();

    const peticion = httpMock.expectOne((llamada) =>
      llamada.url.includes('/academico/studio/versiones/6/publicacion'),
    );
    expect(peticion.request.method).toBe('POST');
    peticion.flush({
      ...PUBLICADA,
      version: { ...PUBLICADA.version, id: 6, number: 2 },
      validation: { ...PUBLICADA.validation, versionId: 6 },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.editable()).toBe(false);
    expect((fixture.nativeElement.textContent as string)).toContain('Versión publicada — sólo lectura');
  });

  it('re-renders the server validation returned when publication is refused', () => {
    configurar('6');
    fixture = crear();
    responder(BORRADOR);

    fixture.componentInstance.confirmarPublicacion();
    confirmaciones[0].nzOnOk();

    httpMock
      .expectOne((llamada) => llamada.url.includes('/academico/studio/versiones/6/publicacion'))
      .flush(
        {
          message: 'La versión no está lista para publicarse.',
          validation: {
            versionId: 6,
            ready: false,
            errors: [
              {
                code: 'version.no_lessons',
                scope: 'version',
                message: 'La versión necesita al menos una lección.',
                targetId: 6,
              },
            ],
            warnings: [],
            checkedAt: '2026-09-03T12:10:00Z',
          },
        },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string)).toContain('La versión necesita al menos una lección.');
    expect(fixture.componentInstance.listoParaPublicar()).toBe(false);
  });
});
