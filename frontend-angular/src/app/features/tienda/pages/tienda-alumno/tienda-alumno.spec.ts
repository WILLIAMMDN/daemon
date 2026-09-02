import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PulseSnapshot } from '../../../../core/modelos/pulse';
import { Activos } from '../../../../core/servicios/activos';
import { PulseService } from '../../../../core/servicios/pulse.service';
import { Tienda } from '../../services/tienda';
import { TiendaAlumno } from './tienda-alumno';

const snapshot: PulseSnapshot = {
  level: { current: 2, maximum: 100, xpWithinLevel: 30, xpRequiredForNextLevel: 200, xpToNextLevel: 170, progressPercent: 15 },
  xpTotal: 130,
  daemsBalance: 64,
  streak: { current: 1, longest: 2, lastQualifyingDate: null, timezone: 'America/Lima' },
  recentAchievements: [],
  recentTransactions: [],
};

describe('TiendaAlumno con Pulse', () => {
  const transactions = signal({
    items: [{
      id: 'movement-1',
      currency: 'daemons',
      type: 'EARN',
      amount: 20,
      signedAmount: 20,
      resultingBalance: 64,
      sourceType: 'pulse',
      sourceId: null,
      reason: 'Experiencia completada',
      metadata: null,
      occurredAt: '2026-09-01T12:00:00Z',
    }],
    currentPage: 1,
    lastPage: 1,
    perPage: 25,
    total: 1,
  });
  const transactionsStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('ready');
  const refreshAll = jest.fn();
  const pulseMock = {
    snapshot: signal<PulseSnapshot | null>(snapshot),
    transactions,
    transactionsStatus,
    transactionsError: () => transactionsStatus() === 'error',
    ensureSnapshot: jest.fn(),
    ensureTransactions: jest.fn(),
    refreshAll,
  };
  const tiendaMock = {
    premios: jest.fn(() => of({ saldo: 999, premios: [] })),
    canjear: jest.fn(() => of({ saldo: 44, message: 'ok' })),
  };

  beforeEach(async () => {
    pulseMock.snapshot.set(snapshot);
    transactions.set({ ...transactions(), items: [{ ...transactions().items[0] }], total: 1 });
    transactionsStatus.set('ready');
    refreshAll.mockClear();
    await TestBed.configureTestingModule({
      imports: [TiendaAlumno],
      providers: [
        provideRouter([]),
        { provide: Tienda, useValue: tiendaMock },
        { provide: PulseService, useValue: pulseMock },
        { provide: Activos, useValue: { url: (path: string | null | undefined) => path ?? '' } },
      ],
    }).compileComponents();
  });

  it('usa el saldo de Pulse y muestra el historial sin IDs internos', () => {
    const fixture = TestBed.createComponent(TiendaAlumno);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.balance-vault strong')?.textContent?.trim()).toBe('64');
    expect(element.textContent).toContain('Experiencia completada');
    expect(element.textContent).toContain('+20 Daems');
    expect(element.textContent).not.toContain('movement-1');
  });

  it('presenta estados vacío y error honestos para las transacciones', () => {
    transactions.set({ ...transactions(), items: [], total: 0 });
    const fixture = TestBed.createComponent(TiendaAlumno);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aún no hay movimientos');

    transactionsStatus.set('error');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pudimos cargar tu actividad');
  });

  it('refresca Pulse después de un canje confirmado', () => {
    const fixture = TestBed.createComponent(TiendaAlumno);
    fixture.componentInstance.canjear(3);
    expect(refreshAll).toHaveBeenCalledTimes(1);
  });
});
