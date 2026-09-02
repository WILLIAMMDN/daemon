import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/servicios/api';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { PulseSnapshot } from '../../../../core/modelos/pulse';
import { PulseService } from '../../../../core/servicios/pulse.service';
import { Tienda } from '../../../tienda/services/tienda';
import { PanelAlumnoDto } from '../../models/panel-alumno.model';
import { Alumno } from '../../services/alumno';
import { PanelAlumno } from './panel-alumno';

const panel: PanelAlumnoDto = {
  usuario: {
    id: 7,
    nombre_completo: 'Luna Estudiante',
    usuario: 'luna',
    rol: 'alumno',
    nivel: 'KIDS',
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
  actividad_semana: [
    { fecha: '2026-07-09', etiqueta: 'jue', activo: false, tipo: null },
    { fecha: '2026-07-10', etiqueta: 'vie', activo: false, tipo: null },
    { fecha: '2026-07-11', etiqueta: 'sab', activo: false, tipo: null },
    { fecha: '2026-07-12', etiqueta: 'dom', activo: false, tipo: null },
    { fecha: '2026-07-13', etiqueta: 'lun', activo: false, tipo: null },
    { fecha: '2026-07-14', etiqueta: 'mar', activo: false, tipo: null },
    { fecha: '2026-07-15', etiqueta: 'mie', activo: true, tipo: 'mision' },
  ],
  proxima_mision: {
    id: 10,
    titulo: 'Privacidad digital',
    recompensa: 50,
    tipo_evidencia: 'texto',
    nivel_requerido: 'KIDS',
  },
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

const pulseSnapshot: PulseSnapshot = {
  level: { current: 5, maximum: 100, xpWithinLevel: 120, xpRequiredForNextLevel: 500, xpToNextLevel: 380, progressPercent: 24 },
  xpTotal: 1120,
  daemsBalance: 80,
  streak: { current: 4, longest: 9, lastQualifyingDate: '2026-07-15', timezone: 'America/Lima' },
  recentAchievements: [],
  recentTransactions: [],
};

const pulseMock = {
  snapshot: signal<PulseSnapshot | null>(pulseSnapshot),
  snapshotStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready'),
  achievements: signal([{ id: 1 }, { id: 2 }, { id: 3 }]),
  achievementsStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready'),
  ensureSnapshot: jest.fn(),
  ensureAchievements: jest.fn(),
};

describe('PanelAlumno', () => {
  const panelMock = jest.fn();
  const sesionMock = {
    usuario: signal(panel.usuario),
    actualizarUsuario: jest.fn(),
  };

  beforeEach(async () => {
    localStorage.clear();
    panelMock.mockReset();
    sesionMock.actualizarUsuario.mockReset();
    panelMock.mockReturnValue(of(panel));
    pulseMock.snapshot.set(pulseSnapshot);
    pulseMock.snapshotStatus.set('ready');
    pulseMock.achievementsStatus.set('ready');

    await TestBed.configureTestingModule({
      imports: [PanelAlumno],
      providers: [
        provideRouter([]),
        { provide: Alumno, useValue: { panel: panelMock, homeContext: jest.fn().mockReturnValue(of(null)) } },
        { provide: Sesion, useValue: sesionMock },
        { provide: PulseService, useValue: pulseMock },
        { provide: Activos, useValue: { url: (ruta: string | null | undefined) => ruta ?? '' } },
        { provide: Tienda, useValue: { premios: jest.fn().mockReturnValue(of({ saldo: 80, premios: [] })) } },
      ],
    }).compileComponents();
  });

  it('presenta prioridad, ranking visible y progreso accesible sin main anidado', () => {
    const fixture = TestBed.createComponent(PanelAlumno);
    fixture.detectChanges();
    const elemento = fixture.nativeElement as HTMLElement;
    const indicadores = elemento.querySelector('[aria-label="Indicadores principales"]');
    const tarjetasIndicadores = Array.from(indicadores?.querySelectorAll('article') ?? []);

    expect(elemento.querySelector('main')).toBeNull();
    expect(elemento.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    expect(tarjetasIndicadores).toHaveLength(4);
    expect(tarjetasIndicadores.some((tarjeta) => tarjeta.textContent?.includes('Tu aula'))).toBe(true);
    expect(elemento.querySelectorAll('[aria-label="Actividad real de los últimos siete días"] li')).toHaveLength(7);
    expect(elemento.querySelector('[aria-label="Prioridades de aprendizaje"] h3')?.textContent?.trim()).toBe('Privacidad digital');
    expect(elemento.textContent).toContain('Nivel 5');
    expect(elemento.textContent).toContain('4');
    expect(elemento.textContent).toContain('Mejor racha: 9 días');
    expect(elemento.querySelector('.metric--logros .metric-value')?.textContent?.trim()).toBe('3');
  });

  it('conserva el ultimo panel cuando falla una actualizacion', () => {
    panelMock
      .mockReturnValueOnce(of(panel))
      .mockReturnValueOnce(throwError(() => new ApiError('offline', 'sin conexion')));
    const fixture = TestBed.createComponent(PanelAlumno);
    fixture.detectChanges();

    fixture.componentInstance.cargar();
    fixture.detectChanges();

    expect(fixture.componentInstance.panel()).toEqual(panel);
    expect((fixture.nativeElement as HTMLElement).querySelector('.offline-notice')?.textContent).toContain('progreso sigue aquí');
  });
});

describe('PanelAlumno · TEENS Creator', () => {
  const panelTeens: PanelAlumnoDto = {
    ...panel,
    usuario: { ...panel.usuario, nivel: 'TEENS' },
  };

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [PanelAlumno],
      providers: [
        provideRouter([]),
        {
          provide: Alumno,
          useValue: {
            panel: jest.fn().mockReturnValue(of(panelTeens)),
            homeContext: jest.fn().mockReturnValue(of(null)),
          },
        },
        { provide: Sesion, useValue: { usuario: signal(panelTeens.usuario), actualizarUsuario: jest.fn() } },
        { provide: PulseService, useValue: pulseMock },
        { provide: Activos, useValue: { url: (ruta: string | null | undefined) => ruta ?? '' } },
        { provide: Tienda, useValue: { premios: jest.fn().mockReturnValue(of({ saldo: 80, premios: [] })) } },
      ],
    }).compileComponents();
  });

  it('presenta el content experience TEENS (Creator Classes + Tech Legends) sin assets KIDS', () => {
    const fixture = TestBed.createComponent(PanelAlumno);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // Variante TEENS activa y bloques DESCUBRE presentes.
    expect(el.querySelector('.student-dashboard--teens')).not.toBeNull();
    expect(el.querySelectorAll('.class-card')).toHaveLength(4);
    expect(el.querySelector('.tech-legends')).not.toBeNull();
    expect(el.querySelector('.class-card[data-clase="maker"] .class-card__micro')).not.toBeNull();

    // Bienvenida sobria y copy TEENS.
    expect(el.querySelector('.welcome-stage')).toBeNull();
    expect(el.textContent).toContain('CONTINÚA CREANDO');
    expect(el.textContent).toContain('Continuar proyecto');

    // Ningún asset KIDS heredado en el DOM TEENS.
    expect(el.querySelector('img[src*="hero-monster"]')).toBeNull();
    expect(el.querySelector('img[src*="monstruo-racha"]')).toBeNull();
    expect(el.querySelector('img[src*="robot-mision"]')).toBeNull();
  });
});
