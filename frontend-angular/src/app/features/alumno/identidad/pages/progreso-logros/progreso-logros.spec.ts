import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PulseSnapshot } from '../../../../../core/modelos/pulse';
import { PulseService } from '../../../../../core/servicios/pulse.service';
import { ProgresoLogros } from './progreso-logros';

const snapshot: PulseSnapshot = {
  level: { current: 6, maximum: 100, xpWithinLevel: 20, xpRequiredForNextLevel: 600, xpToNextLevel: 580, progressPercent: 3 },
  xpTotal: 1520,
  daemsBalance: 31,
  streak: { current: 3, longest: 11, lastQualifyingDate: '2026-09-01', timezone: 'America/Lima' },
  recentAchievements: [],
  recentTransactions: [],
};

describe('ProgresoLogros', () => {
  const achievementsStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('ready');
  const pulseMock = {
    snapshot: signal<PulseSnapshot | null>(snapshot),
    snapshotStatus: signal<'idle' | 'loading' | 'ready' | 'error'>('ready'),
    snapshotError: () => false,
    achievements: signal([{ id: 7, key: 'first', title: 'Primer logro', description: 'Reconocimiento real', category: 'progress', image: null, awardedAt: '2026-09-01', context: null }]),
    achievementsStatus,
    achievementsError: () => achievementsStatus() === 'error',
    ensureSnapshot: jest.fn(),
    ensureAchievements: jest.fn(),
    loadSnapshot: jest.fn(),
  };

  beforeEach(async () => {
    achievementsStatus.set('ready');
    await TestBed.configureTestingModule({
      imports: [ProgresoLogros],
      providers: [provideRouter([]), { provide: PulseService, useValue: pulseMock }],
    }).compileComponents();
  });

  it('distingue progresión Pulse de progreso académico y muestra rachas/logros reales', () => {
    const fixture = TestBed.createComponent(ProgresoLogros);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Nivel 6');
    expect(text).toContain('Racha actual');
    expect(text).toContain('3 días');
    expect(text).toContain('Mejor racha');
    expect(text).toContain('11 días');
    expect(text).toContain('Primer logro');
    expect(text).toContain('Progreso académico');
    expect(text).toContain('no se calculan con XP');
  });
});
