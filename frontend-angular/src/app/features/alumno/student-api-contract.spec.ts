/**
 * DAEMON ARC — Regresión del contrato API Alumno.
 *
 * PR #100 destapó una deriva real: peticiones HTTP correctas, datos reales del
 * backend y UI del Alumno en blanco, porque las interfaces del frontend
 * esperaban nombres heredados en español (`titulo`, `nombre`, `aula`,
 * `startDate`) mientras la API devolvía el contrato canónico (`title`, `name`,
 * `cohort`, `startsOn`).
 *
 * Estos tests alimentan los componentes reales con las respuestas reales del
 * backend (`contexto-alumno.contract.fixtures.ts`) y verifican que el contenido
 * llega a la pantalla. Si alguien vuelve a introducir un nombre heredado, la
 * compilación o estas aserciones fallan.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Activos } from '../../core/servicios/activos';
import { Sesion } from '../../core/servicios/sesion';
import { PulseService } from '../../core/servicios/pulse.service';
import { Tienda } from '../tienda/services/tienda';
import { Actividades } from './services/actividades';
import { EspacioCurso } from './aprender/pages/espacio-curso/espacio-curso';
import { MisCursos } from './aprender/pages/mis-cursos/mis-cursos';
import { PanelAlumno } from './pages/panel-alumno/panel-alumno';
import { Alumno } from './services/alumno';
import { Aprendizaje } from './services/aprendizaje';
import { AprendizajeResponse } from './models/aprendizaje.model';
import { PanelAlumnoDto } from './models/panel-alumno.model';
import {
  AULA_CONTRATO,
  CURSO_CONTRATO,
  HOME_CONTEXT_CONTRATO,
  HOME_CONTEXT_LECCION_LEGACY_CONTRATO,
  LEARNING_CONTEXT_CONTRATO,
  LEARNING_CONTEXT_SIN_MATRICULA_CONTRATO,
  LEARNING_MAP_CONTRATO,
  MATRICULA_CONTRATO,
  PROGRESO_CONTRATO,
} from './models/contexto-alumno.contract.fixtures';

/** Nombres heredados que la API NO devuelve y que el frontend no debe esperar. */
const CAMPOS_HEREDADOS = [
  'titulo',
  'nombre',
  'codigo',
  'descripcion',
  'audiencia',
  'periodo',
  'grado',
  'seccion',
  'aula',
  'startDate',
  'endDate',
  'role',
  'totalLessons',
  'completedLessons',
  'requiredTotal',
  'completedTotal',
];

function clavesProfundas(valor: unknown, acumulado = new Set<string>()): Set<string> {
  if (Array.isArray(valor)) {
    valor.forEach((elemento) => clavesProfundas(elemento, acumulado));
    return acumulado;
  }
  if (valor !== null && typeof valor === 'object') {
    for (const [clave, anidado] of Object.entries(valor as Record<string, unknown>)) {
      acumulado.add(clave);
      clavesProfundas(anidado, acumulado);
    }
  }
  return acumulado;
}

const cursosAprendizaje: AprendizajeResponse = {
  cursos: [
    {
      id: CURSO_CONTRATO.id,
      titulo: CURSO_CONTRATO.title,
      codigo: CURSO_CONTRATO.code,
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
      progreso: { totalLecciones: 18, leccionesCompletadas: 9, porcentaje: 50 },
    },
  ],
  resumen: {
    totalCursos: 1,
    cursosCompletados: 0,
    totalLecciones: 18,
    leccionesCompletadas: 9,
    porcentajeGlobal: 50,
  },
};

const panelDto: PanelAlumnoDto = {
  usuario: {
    id: 42,
    nombre_completo: 'Mateo Salas',
    usuario: 'mateo',
    rol: 'alumno',
    nivel: 'TEENS',
    tokens: 80,
    experiencia: 250,
    nivel_gamificacion: 2,
    progreso_nivel: {
      nivel: 2,
      nivel_maximo: 100,
      experiencia_total: 250,
      experiencia_nivel: 150,
      experiencia_meta: 200,
      experiencia_restante: 50,
      progreso_porcentaje: 75,
    },
  },
  posicion: 2,
  posicion_scope: 'aula',
  posicion_scope_label: 'Tu aula',
  misiones_pendientes: 1,
  misiones_completadas: 3,
  insignias: 2,
  canjes_pendientes: 0,
  racha: 1,
  actividad_semana: [],
  proxima_mision: null,
  progreso_nivel: {
    nivel: 2,
    nivel_maximo: 100,
    experiencia_total: 250,
    experiencia_nivel: 150,
    experiencia_meta: 200,
    experiencia_restante: 50,
    progreso_porcentaje: 75,
  },
};

const pulseMock = {
  snapshot: signal(null),
  snapshotStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready'),
  achievements: signal([]),
  achievementsStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready'),
  ensureSnapshot: jest.fn(),
  ensureAchievements: jest.fn(),
};

describe('DAEMON ARC — Contrato API del Alumno (curso · aula · matrícula · learning context)', () => {
  describe('Forma canónica de las respuestas', () => {
    it('el curso viaja como title/code/version, nunca como titulo/descripcion/audiencia', () => {
      expect(CURSO_CONTRATO.title).toBe('IA: Origen');
      expect(Object.keys(CURSO_CONTRATO).sort()).toEqual(['code', 'id', 'title', 'version']);
    });

    it('el aula viaja como name/code/teacher/period, nunca como nombre/codigo/periodo', () => {
      expect(AULA_CONTRATO.name).toBe('Cohorte IA Teens 2026');
      expect(AULA_CONTRATO.period?.title).toBe('Periodo 2026-I');
      expect(AULA_CONTRATO.period?.startsOn).toBe('2026-03-01');
      expect(Object.keys(AULA_CONTRATO).sort()).toEqual(['code', 'id', 'name', 'period', 'teacher']);
    });

    it('la matrícula viaja como startsOn/endsOn/cohort/curriculumVersion, nunca como startDate/endDate/aula', () => {
      expect(MATRICULA_CONTRATO.startsOn).toBe('2026-03-01');
      expect(MATRICULA_CONTRATO.cohort.id).toBe(AULA_CONTRATO.id);
      expect(MATRICULA_CONTRATO.curriculumVersion?.number).toBe(1);
      expect(Object.keys(MATRICULA_CONTRATO).sort()).toEqual([
        'cohort',
        'course',
        'curriculumVersion',
        'endsOn',
        'id',
        'isPrimary',
        'startsOn',
        'status',
      ]);
    });

    it('el progreso de matrícula viaja como lessonCount/completedLessonCount/lessonProgressPercent', () => {
      expect(Object.keys(PROGRESO_CONTRATO).sort()).toEqual([
        'completedLessonCount',
        'lessonCount',
        'lessonProgressPercent',
      ]);
      expect(PROGRESO_CONTRATO.lessonProgressPercent).toBe(50);
    });

    it('home-context y learning-context no contienen ningún nombre de campo heredado', () => {
      const claves = clavesProfundas([
        HOME_CONTEXT_CONTRATO,
        HOME_CONTEXT_LECCION_LEGACY_CONTRATO,
        LEARNING_CONTEXT_CONTRATO,
        LEARNING_MAP_CONTRATO,
      ]);
      expect(CAMPOS_HEREDADOS.filter((campo) => claves.has(campo))).toEqual([]);
    });

    it('la versión del currículo de la matrícula es curriculumVersion, no courseVersion', () => {
      const matriculas = [
        HOME_CONTEXT_CONTRATO.currentEnrollment,
        LEARNING_CONTEXT_CONTRATO.currentEnrollment,
        ...LEARNING_CONTEXT_CONTRATO.activeEnrollments,
      ];
      for (const matricula of matriculas) {
        expect(Object.keys(matricula!)).toContain('curriculumVersion');
        expect(Object.keys(matricula!)).not.toContain('courseVersion');
      }
      // `courseVersion` sí es canónico, pero solo en `/alumno/aprender/mapa`.
      expect(Object.keys(LEARNING_MAP_CONTRATO)).toContain('courseVersion');
    });

    it('el mapa de aprendizaje usa la proyección propia de Learning Core, no la matrícula completa', () => {
      expect(Object.keys(LEARNING_MAP_CONTRATO.enrollment!).sort()).toEqual(['cohortId', 'id', 'status']);
      expect(LEARNING_MAP_CONTRATO.courseVersion?.courseId).toBe(CURSO_CONTRATO.id);
      expect(Object.keys(LEARNING_MAP_CONTRATO.progress).sort()).toEqual([
        'completedRequiredExperienceCount',
        'percent',
        'requiredExperienceCount',
      ]);
    });

    it('conserva el contrato canónico de sesión en vivo introducido por PR #100', () => {
      const sesion = HOME_CONTEXT_CONTRATO.nextLiveSession!;
      expect(sesion.title).toBe('Variables en vivo');
      expect(sesion.startsAt).toBe('2026-08-31T17:00:00Z');
      expect(sesion.endsAt).toBe('2026-08-31T18:30:00Z');
      expect(sesion.access?.joinUrl).toBe('https://meet.example.test/variables');
      expect(sesion.status).toBe('scheduled');
    });
  });

  describe('Inicio · panel del alumno', () => {
    function montarPanel(homeContext: unknown) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [PanelAlumno],
        providers: [
          provideRouter([]),
          {
            provide: Alumno,
            useValue: {
              panel: jest.fn().mockReturnValue(of(panelDto)),
              homeContext: jest.fn().mockReturnValue(of(homeContext)),
            },
          },
          { provide: Sesion, useValue: { usuario: signal(panelDto.usuario), actualizarUsuario: jest.fn() } },
          { provide: PulseService, useValue: pulseMock },
          { provide: Activos, useValue: { url: (ruta: string | null | undefined) => ruta ?? '' } },
          { provide: Tienda, useValue: { premios: jest.fn().mockReturnValue(of({ saldo: 0, premios: [] })) } },
        ],
      });
      const fixture = TestBed.createComponent(PanelAlumno);
      fixture.detectChanges();
      return fixture;
    }

    it('muestra el título real del curso como contexto de la siguiente acción', () => {
      const fixture = montarPanel(HOME_CONTEXT_CONTRATO);
      const meta = (fixture.nativeElement as HTMLElement).querySelector('.mission-meta');

      expect(meta?.textContent?.trim()).toBe('IA: Origen');
      expect(meta?.textContent).not.toContain('Ruta académica');
    });

    it('etiqueta la siguiente acción con el tipo real aunque el backend lo emita en español', () => {
      const fixture = montarPanel(HOME_CONTEXT_CONTRATO);
      const accion = fixture.componentInstance.accionActual(panelDto)!;

      expect(accion.tipoEtiqueta).toBe('MISIÓN');
      expect(accion.ctaTexto).toBe('Continuar misión');
      expect(accion.titulo).toBe('Diseña tu primer prompt verificable');
    });

    it('usa el curso y el aula de la propia nextAction en la rama legacy sin ruta', () => {
      const sinContextoRaiz = {
        ...HOME_CONTEXT_LECCION_LEGACY_CONTRATO,
        currentCourse: null,
        cohort: null,
      };
      const fixture = montarPanel(sinContextoRaiz);
      const accion = fixture.componentInstance.accionActual(panelDto)!;

      expect(accion.meta).toBe('IA: Origen');
      expect(accion.tipoEtiqueta).toBe('LECCIÓN');
      expect(accion.ruta).toEqual(['/alumno/aprender/curso', CURSO_CONTRATO.id]);
    });

    it('cae al nombre real del aula cuando no hay curso publicado', () => {
      const soloAula = {
        ...HOME_CONTEXT_CONTRATO,
        currentCourse: null,
        nextAction: { ...HOME_CONTEXT_CONTRATO.nextAction!, course: null },
      };
      const fixture = montarPanel(soloAula);

      expect(fixture.componentInstance.accionActual(panelDto)?.meta).toBe('Cohorte IA Teens 2026');
    });
  });

  describe('Aprender · Mis cursos y espacio del curso', () => {
    let httpMock: HttpTestingController;

    function responderContexto(mapa: unknown = LEARNING_MAP_CONTRATO, learning: unknown = LEARNING_CONTEXT_CONTRATO) {
      httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(cursosAprendizaje);
      httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush(learning);
      httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush(HOME_CONTEXT_CONTRATO);
      httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mapa);
    }

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          Aprendizaje,
          {
            provide: Actividades,
            useValue: {
              asegurarCargado: jest.fn(),
              pendientes: signal([]),
              actividades: signal([]),
              cargando: signal(false),
              cargado: signal(true),
              error: signal(false),
            },
          },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: convertToParamMap({ cursoId: String(CURSO_CONTRATO.id) }) },
              paramMap: of(convertToParamMap({ cursoId: String(CURSO_CONTRATO.id) })),
            },
          },
        ],
      });
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('Mis cursos muestra el nombre real del aula de la matrícula activa', () => {
      const fixture = TestBed.createComponent(MisCursos);
      fixture.detectChanges();
      responderContexto();
      fixture.detectChanges();

      expect(fixture.componentInstance.aulaInfo()?.name).toBe('Cohorte IA Teens 2026');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aula: Cohorte IA Teens 2026');
    });

    it('Course Summary muestra aula y período reales de la matrícula', () => {
      const fixture = TestBed.createComponent(EspacioCurso);
      fixture.detectChanges();
      responderContexto();
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(fixture.componentInstance.aula()?.name).toBe('Cohorte IA Teens 2026');
      expect(texto).toContain('Cohorte IA Teens 2026');
      expect(texto).toContain('Periodo 2026-I');
    });

    it('Course Summary lee el progreso de la ruta con los nombres reales de Learning Core', () => {
      const fixture = TestBed.createComponent(EspacioCurso);
      fixture.detectChanges();
      responderContexto();
      fixture.detectChanges();

      expect(fixture.componentInstance.experienciasRequeridasTotal()).toBe(18);
      expect(fixture.componentInstance.experienciasRequeridasCompletadas()).toBe(9);
    });

    it('soporta el fallback legacy sin matrícula: aula real, sin curso ni versión', () => {
      const fixture = TestBed.createComponent(EspacioCurso);
      fixture.detectChanges();
      responderContexto(LEARNING_MAP_CONTRATO, LEARNING_CONTEXT_SIN_MATRICULA_CONTRATO);
      fixture.detectChanges();

      const aula = fixture.componentInstance.aula();
      expect(aula?.name).toBe('Aula Legacy');
      expect(aula?.period).toBeNull();
    });
  });
});
