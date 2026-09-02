import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PulseSnapshot } from '../../../../../core/modelos/pulse';
import { PulseService } from '../../../../../core/servicios/pulse.service';
import { Sesion } from '../../../../../core/servicios/sesion';
import { Aprendizaje } from '../../../services/aprendizaje';
import { ResumenIdentidad } from './resumen-identidad';

const snapshot: PulseSnapshot = {
  level: { current: 4, maximum: 100, xpWithinLevel: 60, xpRequiredForNextLevel: 300, xpToNextLevel: 240, progressPercent: 20 },
  xpTotal: 660,
  daemsBalance: 52,
  streak: { current: 5, longest: 10, lastQualifyingDate: '2026-09-01', timezone: 'America/Lima' },
  recentAchievements: [],
  recentTransactions: [],
};

describe('ResumenIdentidad', () => {
  const usuario = signal({
    id: 12,
    nombre_completo: 'Mateo Creador',
    usuario: 'mateo',
    nivel: 'TEENS',
    avatar: null,
  });

  const snapshotStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('ready');
  const achievementsStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('ready');

  const pulseMock = {
    snapshot: signal<PulseSnapshot | null>(snapshot),
    snapshotStatus,
    snapshotError: () => snapshotStatus() === 'error',
    achievements: signal([{ id: 1, title: 'Insignia 1' }, { id: 2, title: 'Insignia 2' }]),
    achievementsStatus,
    ensureSnapshot: jest.fn(),
    ensureAchievements: jest.fn(),
    loadSnapshot: jest.fn(),
  };

  const aprendizajeMock = {
    cargado: signal(true),
    objetivosProgreso: signal({ totales: 8, logrados: 5, porcentaje: 63 }),
    mastery: signal({ totales: 8, logrados: 5, porcentaje: 63 }),
    asegurarCargado: jest.fn(),
  };

  beforeEach(async () => {
    snapshotStatus.set('ready');
    achievementsStatus.set('ready');
    pulseMock.snapshot.set(snapshot);

    await TestBed.configureTestingModule({
      imports: [ResumenIdentidad],
      providers: [
        provideRouter([]),
        { provide: Sesion, useValue: { usuario } },
        { provide: PulseService, useValue: pulseMock },
        { provide: Aprendizaje, useValue: aprendizajeMock },
      ],
    }).compileComponents();
  });

  it('muestra datos de identidad, progresión Pulse y saldo Daems sin confundirlos con progreso académico', () => {
    const fixture = TestBed.createComponent(ResumenIdentidad);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Datos de usuario
    expect(text).toContain('Mateo Creador');
    expect(text).toContain('Nivel de contenido: TEENS');

    // Progresión Pulse
    expect(text).toContain('Nivel 4 de 100');
    expect(text).toContain('240 XP para subir');
    expect(text).toContain('660'); // XP total
    expect(text).toContain('5 días'); // Racha
    expect(text).toContain('2'); // Insignias
    expect(text).toContain('52'); // Daems

    // Progreso académico (evidencia de cursos)
    expect(text).toContain('Progreso de objetivos');
    expect(text).toContain('5 / 8');
  });

  it('maneja el estado de carga y error de Pulse sin mostrar ceros inventados', () => {
    pulseMock.snapshot.set(null);
    snapshotStatus.set('loading');
    const fixture = TestBed.createComponent(ResumenIdentidad);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nz-skeleton')).not.toBeNull();

    snapshotStatus.set('error');
    fixture.detectChanges();
    expect(element.textContent).toContain('No pudimos cargar tu progresión');
  });
});
