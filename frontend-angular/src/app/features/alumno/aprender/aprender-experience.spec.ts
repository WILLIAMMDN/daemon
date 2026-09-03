import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MisCursos } from './pages/mis-cursos/mis-cursos';
import { Explorar } from './pages/explorar/explorar';
import { EspacioCurso } from './pages/espacio-curso/espacio-curso';
import { Experiencia } from './pages/experiencia/experiencia';
import { Aprendizaje } from '../services/aprendizaje';
import { Actividades } from '../services/actividades';
import {
  canonizarTipoExperiencia,
  ETIQUETA_TIPO_EXPERIENCIA,
  LearningMapResponse,
  RutasAlumnoResponse,
} from '../models/contexto-alumno.model';
import { AprendizajeResponse } from '../models/aprendizaje.model';

describe('DAEMON ARC — Learning Experience Foundation V1 (Aprender)', () => {
  let httpMock: HttpTestingController;
  let aprendizajeService: Aprendizaje;

  const mockAprendizajeResponse: AprendizajeResponse = {
    cursos: [
      {
        id: 101,
        titulo: 'Fundamentos de Algoritmos',
        descripcion: 'Aprende las bases de la lógica y la programación.',
        nivel: 'TEENS',
        unidades: [
          {
            id: 1,
            titulo: 'Unidad 1: Variables y Tipos',
            descripcion: 'Conceptos fundamentales.',
            lecciones: [
              {
                id: 11,
                titulo: 'Variables simples',
                duracion_minutos: 20,
                progresos: [{ estado: 'completed', porcentaje: 100 }],
                objetivos: [{ id: 1, codigo: 'OBJ-01', descripcion: 'Comprender qué es una variable.' }],
              },
              {
                id: 12,
                titulo: 'Tipos primitivos',
                duracion_minutos: 25,
                progresos: [{ estado: 'notStarted', porcentaje: 0 }],
                objetivos: [{ id: 2, codigo: 'OBJ-02', descripcion: 'Diferenciar enteros y booleanos.' }],
              },
            ],
          },
        ],
      },
      {
        id: 102,
        titulo: 'Robótica Básica',
        descripcion: 'Circuitos y sensores.',
        nivel: 'TEENS',
        unidades: [],
      },
    ],
    resumen: {
      cursos: 2,
      lecciones: 2,
      completadas: 1,
      porcentaje: 50,
    },
  };

  const mockLearningMap: LearningMapResponse = {
    path: {
      id: 50,
      title: 'Ruta Troncal Teens',
      description: 'Secuencia principal',
      audience: 'TEENS',
      difficulty: 'intermedia',
      state: 'inProgress',
    },
    milestones: [
      {
        id: 201,
        title: 'Hito 1: Estructuras Básicas',
        description: 'Manejo de flujo.',
        order: 1,
        required: true,
        state: 'completed',
        experiences: [
          {
            id: 301,
            type: 'lesson',
            title: 'Variables simples',
            order: 1,
            required: true,
            state: 'completed',
            progressPercent: 100,
            objectives: [{ id: 1, code: 'OBJ-01', description: 'Comprender qué es una variable.' }],
          },
        ],
      },
      {
        id: 202,
        title: 'Hito 2: Control de Flujo',
        description: 'Condicionales y bucles.',
        order: 2,
        required: true,
        state: 'unlocked',
        experiences: [
          {
            id: 302,
            type: 'practice',
            title: 'Práctica de condicionales',
            order: 1,
            required: true,
            attemptable: true,
            state: 'current',
            progressPercent: 0,
            objectives: [{ id: 2, code: 'OBJ-02', description: 'Diferenciar enteros y booleanos.' }],
          },
          {
            id: 303,
            type: 'mission',
            title: 'Misión del Laberinto',
            order: 2,
            required: true,
            attemptable: true,
            state: 'unlocked',
            progressPercent: 0,
            objectives: [],
          },
          {
            id: 304,
            type: 'assessment',
            title: 'Evaluación de Lógica',
            order: 3,
            required: true,
            attemptable: true,
            state: 'locked',
            progressPercent: 0,
            objectives: [],
          },
        ],
      },
    ],
    nextItem: {
      id: 302,
      type: 'practice',
      title: 'Práctica de condicionales',
      order: 1,
      required: true,
      attemptable: true,
      state: 'current',
      progressPercent: 0,
      objectives: [{ id: 2, code: 'OBJ-02', description: 'Diferenciar enteros y booleanos.' }],
    },
    progress: {
      requiredExperienceCount: 4,
      completedRequiredExperienceCount: 1,
      percent: 25,
    },
    legacyFallback: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        Aprendizaje,
        Actividades,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    aprendizajeService = TestBed.inject(Aprendizaje);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Section 4: Mis Cursos Real Data & Hierarchy', () => {
    it('should distinguish active, not started, and completed courses truthfully', () => {
      const fixture = TestBed.createComponent(MisCursos);
      const component = fixture.componentInstance;

      // Flush Aprendizaje.cargar()
      const reqAprendizaje = httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje'));
      reqAprendizaje.flush(mockAprendizajeResponse);
      const reqCtx = httpMock.expectOne((r) => r.url.includes('/alumno/learning-context'));
      reqCtx.flush({ student: { id: 1 }, currentEnrollment: null, activeEnrollments: [] });
      const reqHome = httpMock.expectOne((r) => r.url.includes('/alumno/home-context'));
      reqHome.flush({ nextLiveSession: null });
      const reqMapa = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa'));
      reqMapa.flush(mockLearningMap);

      // Flush Actividades
      httpMock.expectOne((r) => r.url.includes('/misiones')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/evaluaciones/activas')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/competencia/estado')).flush(null);

      fixture.detectChanges();

      expect(component.sinCursos()).toBe(false);
      expect(component.cursoPrincipal()).toBeTruthy();
      expect(component.cursoPrincipal()?.id).toBe(101);
      expect(component.cursoPrincipal()?.porcentaje).toBe(50);
      expect(component.cursoPrincipal()?.estado).toBe('inProgress');
    });

    it('should prioritize Learning Core actual next action over frontend inference', () => {
      const fixture = TestBed.createComponent(MisCursos);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      httpMock.expectOne((r) => r.url.includes('/misiones')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/evaluaciones/activas')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/competencia/estado')).flush(null);

      fixture.detectChanges();

      const siguiente = component.siguientePaso();
      expect(siguiente).toBeTruthy();
      expect(siguiente?.titulo).toBe('Práctica de condicionales');
      expect(siguiente?.tipoLabel).toBe('Práctica');
      expect(siguiente?.ruta).toEqual(['/alumno/aprender/curso', 101, 'experiencia', 302]);
      expect(siguiente?.ctaTexto).toContain('Práctica de condicionales');
    });

    it('should render honest empty state when student has no assigned courses', () => {
      const fixture = TestBed.createComponent(MisCursos);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush({
        cursos: [],
        resumen: { cursos: 0, lecciones: 0, completadas: 0, porcentaje: 0 },
      });
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush({ milestones: [], nextItem: null, progress: { percent: 0 } });

      httpMock.expectOne((r) => r.url.includes('/misiones')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/evaluaciones/activas')).flush([]);
      httpMock.expectOne((r) => r.url.includes('/competencia/estado')).flush(null);

      fixture.detectChanges();

      expect(component.sinCursos()).toBe(true);
      expect(component.cursoPrincipal()).toBeNull();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Todavía no tienes cursos asignados');
    });
  });

  describe('Section 5: Explorar Eligibility & Honest Empty State', () => {
    it('should query real /alumno/rutas and render eligible learning opportunities', () => {
      const fixture = TestBed.createComponent(Explorar);
      const component = fixture.componentInstance;

      const mockRutasResponse: RutasAlumnoResponse = {
        paths: [
          {
            id: 88,
            title: 'Ruta Avanzada de Inteligencia Artificial',
            description: 'Modelos de lenguaje y visión computacional.',
            audience: 'TEENS',
            difficulty: 'avanzada',
            milestoneCount: 5,
          },
        ],
      };

      const req = httpMock.expectOne((r) => r.url.includes('/alumno/rutas'));
      req.flush(mockRutasResponse);

      fixture.detectChanges();

      expect(component.cargando()).toBe(false);
      expect(component.sinRutas()).toBe(false);
      expect(component.rutas().length).toBe(1);
      expect(component.rutas()[0].title).toBe('Ruta Avanzada de Inteligencia Artificial');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Ruta Avanzada de Inteligencia Artificial');
      expect(compiled.textContent).toContain('Nivel Avanzado');
    });

    it('should present an honest empty state without fabricating fake catalog cards', () => {
      const fixture = TestBed.createComponent(Explorar);
      const component = fixture.componentInstance;

      const req = httpMock.expectOne((r) => r.url.includes('/alumno/rutas'));
      req.flush({ paths: [] });

      fixture.detectChanges();

      expect(component.cargando()).toBe(false);
      expect(component.sinRutas()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No hay nuevas rutas de aprendizaje disponibles');
      expect(compiled.textContent).toContain('asignadas directamente por tus docentes');
      // Zero fake courses fabricated
      expect(compiled.querySelectorAll('.tarjeta-oportunidad').length).toBe(0);
    });
  });

  describe('Section 6, 7, 8, 9, 11: Course Context (Resumen, Ruta, Contenido, Progreso)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: convertToParamMap({ cursoId: '101' }) },
              paramMap: of(convertToParamMap({ cursoId: '101' })),
            },
          },
          Aprendizaje,
        ],
      });
      httpMock = TestBed.inject(HttpTestingController);
      aprendizajeService = TestBed.inject(Aprendizaje);
    });

    it('should provide contextual course navigation and NOT pollute the global sidebar', () => {
      const fixture = TestBed.createComponent(EspacioCurso);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      fixture.detectChanges();

      expect(component.curso()?.id).toBe(101);
      expect(component.subvista()).toBe('resumen');

      const compiled = fixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('.curso-nav');
      expect(nav).toBeTruthy();
      const items = nav?.querySelectorAll('.curso-nav-item');
      expect(items?.length).toBe(4);
      expect(items?.[0].textContent?.trim()).toBe('Resumen');
      expect(items?.[1].textContent?.trim()).toBe('Ruta');
      expect(items?.[2].textContent?.trim()).toBe('Contenido');
      expect(items?.[3].textContent?.trim()).toBe('Progreso');
    });

    it('should render 404 result when course is not in student enrollment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: convertToParamMap({ cursoId: '999' }) },
              paramMap: of(convertToParamMap({ cursoId: '999' })),
            },
          },
          Aprendizaje,
        ],
      });
      const localHttpMock = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(EspacioCurso);
      const component = fixture.componentInstance;

      localHttpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      localHttpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      localHttpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      localHttpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      fixture.detectChanges();

      expect(component.noEncontrado()).toBe(true);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Curso no disponible');
      localHttpMock.verify();
    });

    it('should strictly display academic progress without Mastery % or Pulse XP metrics', () => {
      const fixture = TestBed.createComponent(EspacioCurso);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      fixture.detectChanges();

      // Verify academic progress metrics
      expect(component.hitosCompletadosConteo()).toBe(1);
      expect(component.experienciasRequeridasCompletadas()).toBe(1);
      expect(component.experienciasRequeridasTotal()).toBe(4);
      expect(component.objetivosLogradosConteo()).toBe(1);
      expect(component.objetivosAcademicos().length).toBe(2);

      // Verify NO fake mastery claims or pulse XP
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Mastery %');
      expect(compiled.textContent).not.toContain('Dominio %');
      expect(compiled.textContent).not.toContain('XP');
      expect(compiled.textContent).not.toContain('Daems');
    });
  });

  describe('Section 10: Reusable Learning Experience Shell', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: convertToParamMap({ cursoId: '101', experienceId: '302' }) },
              paramMap: of(convertToParamMap({ cursoId: '101', experienceId: '302' })),
            },
          },
          Aprendizaje,
        ],
      });
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should render reusable shell for practice type with objective and attempt action', () => {
      const fixture = TestBed.createComponent(Experiencia);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      fixture.detectChanges();

      expect(component.experiencia()?.id).toBe(302);
      expect(component.tipoCanonico()).toBe('practice');
      expect(component.tipoEtiqueta()).toBe('Práctica');
      expect(component.experiencia()?.objectives.length).toBe(1);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Práctica de condicionales');
      expect(compiled.textContent).toContain('OBJ-02');
      expect(compiled.textContent).toContain('Iniciar intento');
    });

    it('should support sequential navigation across experiences in the learning map', () => {
      const fixture = TestBed.createComponent(Experiencia);
      const component = fixture.componentInstance;

      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMap);

      fixture.detectChanges();

      expect(component.anterior()?.id).toBe(301);
      expect(component.anterior()?.title).toBe('Variables simples');
      expect(component.siguiente()?.id).toBe(303);
      expect(component.siguiente()?.title).toBe('Misión del Laberinto');
    });

    it('should correctly canonicalize all 7 experience types', () => {
      expect(canonizarTipoExperiencia('lesson')).toBe('lesson');
      expect(canonizarTipoExperiencia('leccion')).toBe('lesson');
      expect(canonizarTipoExperiencia('practice')).toBe('practice');
      expect(canonizarTipoExperiencia('practica')).toBe('practice');
      expect(canonizarTipoExperiencia('mission')).toBe('mission');
      expect(canonizarTipoExperiencia('mision')).toBe('mission');
      expect(canonizarTipoExperiencia('lab')).toBe('lab');
      expect(canonizarTipoExperiencia('laboratorio')).toBe('lab');
      expect(canonizarTipoExperiencia('assessment')).toBe('assessment');
      expect(canonizarTipoExperiencia('evaluacion')).toBe('assessment');
      expect(canonizarTipoExperiencia('project')).toBe('project');
      expect(canonizarTipoExperiencia('proyecto')).toBe('project');
      expect(canonizarTipoExperiencia('challenge')).toBe('challenge');
      expect(canonizarTipoExperiencia('desafio')).toBe('challenge');

      expect(ETIQUETA_TIPO_EXPERIENCIA['lesson']).toBe('Lección');
      expect(ETIQUETA_TIPO_EXPERIENCIA['practice']).toBe('Práctica');
      expect(ETIQUETA_TIPO_EXPERIENCIA['mission']).toBe('Misión');
      expect(ETIQUETA_TIPO_EXPERIENCIA['lab']).toBe('Laboratorio');
      expect(ETIQUETA_TIPO_EXPERIENCIA['assessment']).toBe('Evaluación');
      expect(ETIQUETA_TIPO_EXPERIENCIA['project']).toBe('Proyecto');
      expect(ETIQUETA_TIPO_EXPERIENCIA['challenge']).toBe('Desafío');
    });
  });
});
