import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RevisionesDocente } from './revisiones';
import { IntentoRevisionDto } from '../../models/revision.model';

describe('DAEMON ARC — Teacher Feedback Operations (RevisionesDocente)', () => {
  let httpMock: HttpTestingController;

  const mockPendingItem: IntentoRevisionDto = {
    id: 10,
    uuid: 'uuid-intento-10',
    attemptNumber: 1,
    status: 'submitted',
    score: null,
    approved: null,
    submittedAt: '2026-09-02T18:00:00Z',
    evaluatedAt: null,
    student: {
      id: 5,
      name: 'Valeria Luna',
      username: 'valeria-luna',
      level: 'TEENS',
      avatar: null,
    },
    cohort: {
      id: 2,
      name: 'Cohorte IA Teens Alpha',
      code: 'AULA-ALPHA',
    },
    course: {
      id: 20,
      title: 'IA: Origen',
      version: 'IA_ORIGEN_TEENS_2026_V1',
    },
    milestone: {
      id: 1,
      title: 'Desmitificando a la máquina',
      order: 1,
    },
    experience: {
      id: 102,
      title: 'Laboratorio: Entrenamiento de un clasificador',
      type: 'laboratorio',
      order: 2,
      summary: 'Entrena un clasificador de visión computacional y analiza su comportamiento.',
      instructions: {
        tipo_actividad: 'laboratorio_guiado',
        herramienta_sugerida: 'Teachable Machine',
        campos_requeridos: ['Muestras', 'Análisis de falsos positivos'],
        preguntas_informe: ['¿Qué ocurrió al cambiar la iluminación de fondo?'],
      },
      objectives: [
        {
          id: 1,
          code: 'AI-01',
          description: 'Comprender mecanismos fundamentales de la IA',
        },
      ],
    },
    evidences: [
      {
        id: 1001,
        type: 'lab_output',
        reference: 'Entrené 25 muestras de gatos y 25 de perros. Con fondo oscuro la confianza bajó al 40%.',
        metadata: {
          tool: 'Teachable Machine',
          classes: 2,
          hipotesis: 'El contraste de luz afecta la extracción de bordes.',
        },
        registeredAt: '2026-09-02T18:00:00Z',
      },
    ],
    feedback: [],
  };

  const mockEvaluatedItem: IntentoRevisionDto = {
    id: 9,
    uuid: 'uuid-intento-9',
    attemptNumber: 1,
    status: 'evaluated',
    score: 95,
    approved: true,
    submittedAt: '2026-09-01T15:00:00Z',
    evaluatedAt: '2026-09-01T17:00:00Z',
    student: {
      id: 6,
      name: 'Mateo Rojas',
      username: 'mateo-rojas',
      level: 'TEENS',
      avatar: null,
    },
    cohort: {
      id: 2,
      name: 'Cohorte IA Teens Alpha',
      code: 'AULA-ALPHA',
    },
    course: {
      id: 20,
      title: 'IA: Origen',
      version: 'IA_ORIGEN_TEENS_2026_V1',
    },
    milestone: {
      id: 1,
      title: 'Desmitificando a la máquina',
      order: 1,
    },
    experience: {
      id: 101,
      title: 'Radiografía de una IA cotidiana',
      type: 'mision',
      order: 3,
      summary: 'Analiza un sistema de IA real distinguiendo entrada, modelo y salida.',
      objectives: [
        {
          id: 1,
          code: 'AI-01',
          description: 'Comprender mecanismos fundamentales de la IA',
        },
      ],
    },
    evidences: [
      {
        id: 901,
        type: 'mission_delivery',
        reference: 'Analicé el sistema de recomendación de videos...',
        registeredAt: '2026-09-01T15:00:00Z',
      },
    ],
    feedback: [
      {
        id: 801,
        comment: 'Excelente descomposición de las entradas y la función de pérdida.',
        authorName: 'Profesor Carlos Mentor',
        registeredAt: '2026-09-01T17:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RevisionesDocente],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. should render the review queue with real pending review items', () => {
    const fixture = TestBed.createComponent(RevisionesDocente);
    const component = fixture.componentInstance;

    // Flush initial request to /academico/revisiones
    const req = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockPendingItem, mockEvaluatedItem] });

    fixture.detectChanges();

    expect(component.cargando()).toBe(false);
    expect(component.intentos().length).toBe(2);
    expect(component.pendientes().length).toBe(1);
    expect(component.revisadas().length).toBe(1);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Valeria Luna');
    expect(compiled.textContent).toContain('IA: Origen');
    expect(compiled.textContent).toContain('Laboratorio: Entrenamiento de un clasificador');
  });

  it('2. should open detail modal and render submitted evidence, task criteria and student context', () => {
    const fixture = TestBed.createComponent(RevisionesDocente);
    const component = fixture.componentInstance;

    const req = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    req.flush({ data: [mockPendingItem] });
    fixture.detectChanges();

    component.abrirRevision(mockPendingItem);
    fixture.detectChanges();

    expect(component.modalVisible()).toBe(true);
    expect(component.intentoSeleccionado()?.id).toBe(10);

    const modalEl = document.querySelector('.modal-revision') || document.body;
    // Check student context
    expect(modalEl.textContent).toContain('Valeria Luna');
    expect(modalEl.textContent).toContain('@valeria-luna');
    // Check task consigna
    expect(modalEl.textContent).toContain('Teachable Machine');
    expect(modalEl.textContent).toContain('¿Qué ocurrió al cambiar la iluminación de fondo?');
    // Check submitted evidence reference text
    expect(modalEl.textContent).toContain('Entrené 25 muestras de gatos y 25 de perros');
    // Check structured metadata
    expect(modalEl.textContent).toContain('Herramienta utilizada');
    expect(modalEl.textContent).toContain('Número de clases entrenadas');
  });

  it('3. should submit formative evaluation and call POST /academico/intentos/:id/evaluar', () => {
    const fixture = TestBed.createComponent(RevisionesDocente);
    const component = fixture.componentInstance;

    const reqInit = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    reqInit.flush({ data: [mockPendingItem] });
    fixture.detectChanges();

    component.abrirRevision(mockPendingItem);
    component.formAprobado.set(true);
    component.formPuntaje.set(95);
    component.formComentario.set('FORTALEZA: Excelente delimitación del experimento.');

    component.guardarEvaluacion();
    fixture.detectChanges();

    // Expect POST request to evaluate endpoint
    const reqEval = httpMock.expectOne((r) => r.url.includes('/academico/intentos/10/evaluar'));
    expect(reqEval.request.method).toBe('POST');
    expect(reqEval.request.body).toEqual({
      aprobado: true,
      puntaje: 95,
      comentario: 'FORTALEZA: Excelente delimitación del experimento.',
    });

    reqEval.flush({
      id: 10,
      estado: 'evaluated',
      aprobado: true,
      puntaje: 95,
    });

    // Expect queue reload
    const reqReload = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    reqReload.flush({ data: [{ ...mockPendingItem, status: 'evaluated', approved: true }] });

    fixture.detectChanges();

    expect(component.modalVisible()).toBe(false);
    expect(component.feedbackMensaje()).toContain('Valeria Luna fue evaluada correctamente');
  });

  it('4. should handle empty queue state gracefully', () => {
    const fixture = TestBed.createComponent(RevisionesDocente);
    const component = fixture.componentInstance;

    const req = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    req.flush({ data: [] });
    fixture.detectChanges();

    expect(component.cargando()).toBe(false);
    expect(component.intentos().length).toBe(0);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No hay entregas pendientes de revisión');
  });

  it('5. should handle error states gracefully', () => {
    const fixture = TestBed.createComponent(RevisionesDocente);
    const component = fixture.componentInstance;

    const req = httpMock.expectOne((r) => r.url.includes('/academico/revisiones'));
    req.flush({ message: 'Error de servidor' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.cargando()).toBe(false);
    expect(component.error()).toBe('Error de servidor');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error de servidor');
  });
});
