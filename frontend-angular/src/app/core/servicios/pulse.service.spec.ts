import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PulseSnapshotApi, PulseTransaccionesApi } from '../modelos/pulse';
import { Api } from './api';
import { PulseService } from './pulse.service';
import { Sesion, UsuarioSesion } from './sesion';

const snapshotApi: PulseSnapshotApi = {
  level: {
    current: 3,
    maximum: 100,
    xpWithinLevel: 40,
    xpRequiredForNextLevel: 300,
    xpToNextLevel: 260,
    progressPercent: 13,
  },
  xp: { total: 340 },
  daems: { balance: 27 },
  streak: { current: 2, longest: 5, lastQualifyingDate: '2026-09-01', timezone: 'America/Lima' },
  recentAchievements: [],
  recentTransactions: [],
};

const alumno = (id: number): UsuarioSesion => ({ id, rol: 'alumno', tokens: 999 });

describe('PulseService', () => {
  const usuario = signal<UsuarioSesion | null>(null);
  const get = jest.fn();

  beforeEach(() => {
    usuario.set(null);
    get.mockReset();
    TestBed.configureTestingModule({
      providers: [
        PulseService,
        { provide: Api, useValue: { get } },
        { provide: Sesion, useValue: { usuario } },
      ],
    });
  });

  it('normaliza snapshot, transacciones y logros desde los contratos Pulse', async () => {
    const transaccionesApi: PulseTransaccionesApi = {
      data: [{
        id: 'tx-1',
        currency: 'daemons',
        type: 'EARN',
        amount: 12,
        signedAmount: 12,
        resultingBalance: 27,
        sourceType: 'pulse',
        sourceId: 9,
        reason: 'Ruta completada',
        metadata: null,
        occurredAt: '2026-09-01T12:00:00Z',
      }],
      current_page: 1,
      last_page: 2,
      per_page: 25,
      total: 26,
    };
    get
      .mockReturnValueOnce(of(snapshotApi))
      .mockReturnValueOnce(of(transaccionesApi))
      .mockReturnValueOnce(of({ data: [{
        id: 4,
        key: 'first-path',
        title: 'Primer camino',
        description: 'Completaste una ruta.',
        category: 'progress',
        image: null,
        awardedAt: '2026-09-01T12:00:00Z',
        context: null,
      }] }));

    const service = TestBed.inject(PulseService);
    const snapshot = await firstValueFrom(service.getSnapshot());
    const transactions = await firstValueFrom(service.getTransactions());
    const achievements = await firstValueFrom(service.getAchievements());

    expect(snapshot).toMatchObject({ xpTotal: 340, daemsBalance: 27, level: { current: 3, progressPercent: 13 } });
    expect(transactions).toMatchObject({ total: 26, lastPage: 2, items: [{ signedAmount: 12, reason: 'Ruta completada' }] });
    expect(achievements).toEqual([expect.objectContaining({ key: 'first-path', title: 'Primer camino' })]);
  });

  it('expone el error sin sustituirlo por cifras falsas', () => {
    get.mockReturnValue(throwError(() => new Error('offline')));
    const service = TestBed.inject(PulseService);

    service.loadSnapshot();

    expect(service.snapshot()).toBeNull();
    expect(service.snapshotStatus()).toBe('error');
  });

  it('descarta el estado anterior y vuelve a cargar al cambiar de estudiante', () => {
    get.mockImplementation(() => of(snapshotApi));
    usuario.set(alumno(1));
    const service = TestBed.inject(PulseService);
    TestBed.flushEffects();
    expect(service.snapshot()?.xpTotal).toBe(340);

    get.mockImplementation(() => of({ ...snapshotApi, xp: { total: 80 }, daems: { balance: 5 } }));
    usuario.set(alumno(2));
    TestBed.flushEffects();

    expect(service.snapshot()?.xpTotal).toBe(80);
    expect(service.snapshot()?.daemsBalance).toBe(5);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
