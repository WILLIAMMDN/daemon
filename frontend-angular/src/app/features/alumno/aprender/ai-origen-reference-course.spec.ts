import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Experiencia } from './pages/experiencia/experiencia';
import { Aprendizaje } from '../services/aprendizaje';
import { LearningMapResponse } from '../models/contexto-alumno.model';
import { AprendizajeResponse } from '../models/aprendizaje.model';

describe('DAEMON ARC — IA: Origen (Teens) Reference Course Experience Shell', () => {
  let httpMock: HttpTestingController;

  const mockAprendizajeResponse: AprendizajeResponse = {
    cursos: [
      {
        id: 20,
        titulo: 'IA: Origen',
        codigo: 'IA-ORIGEN-TEENS',
        descripcion: 'Entiende, dirige, verifica y crea con inteligencia artificial.',
        nivel: 'TEENS',
        estado: 'published',
        unidades: [
          {
            id: 1,
            titulo: 'Unidad 1: ¿La IA piensa?',
            orden: 1,
            lecciones: [
              {
                id: 101,
                titulo: 'IA no es magia',
                orden: 1,
                duracion_minutos: 25,
                estado: 'published',
                progresoActual: { id: 1, estado: 'unlocked', porcentaje: 0 },
                objetivos: [{ id: 1, codigo: 'AI-01', descripcion: 'Comprender mecanismos de la IA' }],
              },
            ],
          },
        ],
        progreso: {
          totalLecciones: 18,
          leccionesCompletadas: 0,
          porcentaje: 0,
        },
      },
    ],
    resumen: {
      totalCursos: 1,
      cursosCompletados: 0,
      totalLecciones: 18,
      leccionesCompletadas: 0,
      porcentajeGlobal: 0,
    },
  };

  const mockLearningMap: LearningMapResponse = {
    enrollment: {
      id: 1,
      role: 'student',
      status: 'active',
      isPrimary: true,
      aula: { id: 10, nombre: 'Cohorte IA Teens 2026' },
      course: { id: 20, titulo: 'IA: Origen', audiencia: 'TEENS' },
    },
    courseVersion: {
      id: 5,
      version: 'IA_ORIGEN_TEENS_2026_V1',
      estado: 'published',
      audience: 'TEENS',
      difficulty: 'inicial',
    },
    path: {
      id: 1,
      title: 'IA: Origen',
      audience: 'TEENS',
      difficulty: 'inicial',
    },
    progress: {
      requiredExperienceCount: 18,
      completedRequiredExperienceCount: 0,
      percent: 0,
    },
    milestones: [
      {
        id: 1,
        title: '¿La IA piensa?',
        description: 'Fundamentos y desmitificación.',
        order: 1,
        required: true,
        state: 'unlocked',
        experiences: [
          {
            id: 101,
            type: 'lesson',
            title: 'IA no es magia',
            summary: 'Reglas fijas vs. patrones aprendidos: comprende el flujo real datos → modelo → inferencia.',
            content: {
              tipo: 'leccion_estructurada',
              bloques: [
                { tipo: 'concepto', texto: 'La inteligencia artificial no "sabe", no "piensa" ni siente curiosidad.' },
                { tipo: 'ejemplo', titulo: 'Reglas vs. Aprendizaje', texto: 'Un corrector busca en reglas; un LLM calcula probabilidades.' },
                { tipo: 'llamado', titulo: 'Desmitificación clave', texto: 'La fluidez gramatical no equivale a comprensión ni veracidad.' },
              ],
            },
            order: 1,
            required: true,
            attemptable: false,
            state: 'current',
            progressPercent: 0,
            objectives: [
              { id: 1, code: 'AI-01', description: 'Comprender mecanismos fundamentales de la IA' },
            ],
          },
          {
            id: 102,
            type: 'lab',
            title: 'Entrena, prueba y rompe un modelo simple',
            summary: 'Experimenta con clasificación visual y prueba qué ocurre con datos desbalanceados.',
            instructions: {
              tipo_actividad: 'laboratorio_guiado',
              herramienta_sugerida: 'Teachable Machine (sin cuenta requerida)',
              preguntas_informe: [
                '¿Qué clases entrenaste y cuántos ejemplos utilizaste?',
                '¿Qué ocurrió cuando probaste un ejemplo ambiguo?',
              ],
            },
            order: 2,
            required: true,
            attemptable: true,
            maxAttempts: 3,
            state: 'unlocked',
            progressPercent: 0,
            objectives: [
              { id: 1, code: 'AI-01', description: 'Comprender mecanismos fundamentales de la IA' },
            ],
          },
        ],
      },
      {
        id: 5,
        title: '¿Qué problema vale la pena resolver?',
        description: 'Fase 1 del Proyecto Capstone.',
        order: 5,
        required: true,
        state: 'locked',
        experiences: [
          {
            id: 501,
            type: 'project',
            title: 'Capstone 1 — Define el problema',
            summary: 'Redacta el Project Brief: define el problema real y los límites de la IA.',
            instructions: {
              tipo_actividad: 'project_brief',
              campos_requeridos: ['Problema identificado', 'Usuario beneficiado', 'Límites de la IA'],
              rubrica_referencia: ['Definición del problema', 'Rol Humano–IA', 'Privacidad y seguridad'],
            },
            order: 1,
            required: true,
            attemptable: true,
            state: 'locked',
            progressPercent: 0,
            objectives: [
              { id: 6, code: 'AI-06', description: 'Diseñar y defender soluciones asistidas por IA' },
            ],
          },
        ],
      },
    ],
    nextItem: {
      id: 101,
      type: 'lesson',
      title: 'IA no es magia',
      order: 1,
      required: true,
      state: 'current',
      progressPercent: 0,
      objectives: [],
    },
    legacyFallback: false,
  };

  function setupTestBed(experienceId: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ cursoId: '20', experienceId }) },
            paramMap: of(convertToParamMap({ cursoId: '20', experienceId })),
          },
        },
        Aprendizaje,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  it('renders lesson structured blocks (concepts, examples, and callouts)', () => {
    setupTestBed('101');
    const fixture = TestBed.createComponent(Experiencia);
    const component = fixture.componentInstance;

    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('IA no es magia');
    expect(el.textContent).toContain('AI-01');
    expect(el.textContent).toContain('Comprender mecanismos fundamentales de la IA');
    expect(el.textContent).toContain('La inteligencia artificial no "sabe"');
    expect(el.textContent).toContain('Reglas vs. Aprendizaje');
    expect(el.textContent).toContain('Desmitificación clave');

    // Botón para marcar avance
    const botonLeccion = el.querySelector('button');
    expect(botonLeccion?.textContent).toContain('Marcar lección como completada');
  });

  it('renders lab with tool recommendations and guided questions', () => {
    setupTestBed('102');
    const fixture = TestBed.createComponent(Experiencia);
    const component = fixture.componentInstance;

    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Entrena, prueba y rompe un modelo simple');
    expect(el.textContent).toContain('Laboratorio');
    expect(el.textContent).toContain('Teachable Machine');
    expect(el.textContent).toContain('no compartas datos personales');
    expect(el.textContent).toContain('¿Qué clases entrenaste y cuántos ejemplos utilizaste?');

    // Muestra botón para iniciar intento
    const botonIntento = el.querySelector('button');
    expect(botonIntento?.textContent).toContain('Iniciar intento');
  });

  it('initiates attempt and submits lab_output evidence for lab', () => {
    setupTestBed('102');
    const fixture = TestBed.createComponent(Experiencia);
    const component = fixture.componentInstance;

    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

    fixture.detectChanges();

    // Iniciar intento
    component.iniciarIntento();
    const reqIntento = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/experiencias/102/intentos'));
    reqIntento.flush({ id: 501, numero: 1 });

    fixture.detectChanges();
    expect(component.intentoIniciado()).toBe(501);

    // Entrega de evidencia
    component.evidenciaTexto.set('Reporte: entrené 20 fotos de manzanas y 20 de plátanos. Con fondo oscuro el acierto bajó al 50%.');
    component.entregarEvidencia();

    const reqEvidencia = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/501/evidencias'));
    expect(reqEvidencia.request.body.tipo).toBe('lab_output');
    expect(reqEvidencia.request.body.referencia).toContain('Reporte: entrené 20 fotos');
    reqEvidencia.flush({ estado: 'submitted' });

    fixture.detectChanges();
    expect(component.feedback()).toContain('Tu evidencia fue enviada');
  });

  it('renders capstone project with required fields and rubric criteria', () => {
    setupTestBed('501');
    const fixture = TestBed.createComponent(Experiencia);
    const component = fixture.componentInstance;

    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Capstone 1 — Define el problema');
    expect(el.textContent).toContain('Proyecto');
    expect(el.textContent).toContain('Campos requeridos en tu entrega:');
    expect(el.textContent).toContain('Problema identificado');
    expect(el.textContent).toContain('Criterios de evaluación formativa del Capstone:');
    expect(el.textContent).toContain('Rol Humano–IA');
  });

  it('renders formative teacher feedback when available', () => {
    setupTestBed('101');
    const fixture = TestBed.createComponent(Experiencia);

    const mapWithFeedback: LearningMapResponse = {
      ...mockLearningMap,
      milestones: [
        {
          ...mockLearningMap.milestones[0],
          experiences: [
            {
              ...mockLearningMap.milestones[0].experiences[0],
              latestFeedback: {
                comment: 'Excelente análisis sobre por qué los modelos probabilísticos no poseen comprensión real.',
                registeredAt: '2026-09-02T10:00:00Z',
              },
            },
            mockLearningMap.milestones[0].experiences[1],
          ],
        },
        mockLearningMap.milestones[1],
      ],
    };

    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mapWithFeedback);

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Retroalimentación formativa');
    expect(el.textContent).toContain('Excelente análisis sobre por qué los modelos');
  });
});
