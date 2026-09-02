import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import {
  EstadoCargaPulse,
  LogroPulse,
  PaginaTransaccionesPulse,
  PulseLogrosApi,
  PulseSnapshot,
  PulseSnapshotApi,
  PulseTransaccionesApi,
  TransaccionPulse,
} from '../modelos/pulse';
import { Api } from './api';
import { Sesion } from './sesion';

@Injectable({ providedIn: 'root' })
export class PulseService {
  private readonly api = inject(Api);
  private readonly sesion = inject(Sesion);
  private usuarioId: number | null = this.studentId();

  readonly snapshot = signal<PulseSnapshot | null>(null);
  readonly achievements = signal<LogroPulse[]>([]);
  readonly transactions = signal<PaginaTransaccionesPulse | null>(null);

  readonly snapshotStatus = signal<EstadoCargaPulse>('idle');
  readonly achievementsStatus = signal<EstadoCargaPulse>('idle');
  readonly transactionsStatus = signal<EstadoCargaPulse>('idle');

  readonly snapshotError = computed(() => this.snapshotStatus() === 'error');
  readonly achievementsError = computed(() => this.achievementsStatus() === 'error');
  readonly transactionsError = computed(() => this.transactionsStatus() === 'error');

  constructor() {
    if (this.usuarioId !== null) this.loadSnapshot();

    effect(() => {
      const siguienteId = this.studentId();

      if (siguienteId === this.usuarioId) return;

      this.usuarioId = siguienteId;
      this.reset();

      if (siguienteId !== null) {
        this.loadSnapshot();
      }
    });
  }

  getSnapshot(fresh = false): Observable<PulseSnapshot> {
    return this.api
      .get<PulseSnapshotApi>('/alumno/pulse', { fresh })
      .pipe(map((response) => this.mapSnapshot(response)));
  }

  getTransactions(page = 1, fresh = false): Observable<PaginaTransaccionesPulse> {
    return this.api
      .get<PulseTransaccionesApi>(`/alumno/pulse/transacciones?page=${page}`, { fresh })
      .pipe(map((response) => this.mapTransactions(response)));
  }

  getAchievements(fresh = false): Observable<LogroPulse[]> {
    return this.api
      .get<PulseLogrosApi>('/alumno/pulse/logros', { fresh })
      .pipe(map((response) => (response.data ?? []).map((achievement) => this.mapAchievement(achievement))));
  }

  ensureSnapshot(): void {
    if (this.snapshotStatus() === 'idle') this.loadSnapshot();
  }

  ensureAchievements(): void {
    if (this.achievementsStatus() === 'idle') this.loadAchievements();
  }

  ensureTransactions(): void {
    if (this.transactionsStatus() === 'idle') this.loadTransactions();
  }

  loadSnapshot(fresh = false): void {
    if (this.snapshotStatus() === 'loading') return;

    this.snapshotStatus.set('loading');
    this.getSnapshot(fresh).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.snapshotStatus.set('ready');
      },
      error: () => this.snapshotStatus.set('error'),
    });
  }

  loadAchievements(fresh = false): void {
    if (this.achievementsStatus() === 'loading') return;

    this.achievementsStatus.set('loading');
    this.getAchievements(fresh).subscribe({
      next: (achievements) => {
        this.achievements.set(achievements);
        this.achievementsStatus.set('ready');
      },
      error: () => this.achievementsStatus.set('error'),
    });
  }

  loadTransactions(fresh = false, page = 1): void {
    if (this.transactionsStatus() === 'loading') return;

    this.transactionsStatus.set('loading');
    this.getTransactions(page, fresh)
      .pipe(finalize(() => {
        if (this.transactionsStatus() === 'loading') this.transactionsStatus.set('idle');
      }))
      .subscribe({
        next: (transactions) => {
          this.transactions.set(transactions);
          this.transactionsStatus.set('ready');
        },
        error: () => this.transactionsStatus.set('error'),
      });
  }

  refreshAll(): void {
    this.loadSnapshot(true);
    this.loadAchievements(true);
    this.loadTransactions(true);
  }

  reset(): void {
    this.snapshot.set(null);
    this.achievements.set([]);
    this.transactions.set(null);
    this.snapshotStatus.set('idle');
    this.achievementsStatus.set('idle');
    this.transactionsStatus.set('idle');
  }

  private mapSnapshot(response: PulseSnapshotApi): PulseSnapshot {
    return {
      level: {
        current: this.number(response.level.current),
        maximum: this.number(response.level.maximum),
        xpWithinLevel: this.number(response.level.xpWithinLevel),
        xpRequiredForNextLevel: this.number(response.level.xpRequiredForNextLevel),
        xpToNextLevel: this.number(response.level.xpToNextLevel),
        progressPercent: this.percent(response.level.progressPercent),
      },
      xpTotal: this.number(response.xp.total),
      daemsBalance: this.number(response.daems.balance),
      streak: {
        current: this.number(response.streak.current),
        longest: this.number(response.streak.longest),
        lastQualifyingDate: response.streak.lastQualifyingDate ?? null,
        timezone: response.streak.timezone,
      },
      recentAchievements: (response.recentAchievements ?? []).map((item) => this.mapAchievement(item)),
      recentTransactions: (response.recentTransactions ?? []).map((item) => this.mapTransaction(item)),
    };
  }

  private mapTransactions(response: PulseTransaccionesApi): PaginaTransaccionesPulse {
    const items = (response.data ?? []).map((item) => this.mapTransaction(item));
    return {
      items,
      currentPage: this.number(response.current_page, 1),
      lastPage: this.number(response.last_page, 1),
      perPage: this.number(response.per_page, items.length),
      total: this.number(response.total, items.length),
    };
  }

  private mapAchievement(achievement: LogroPulse): LogroPulse {
    return {
      id: this.number(achievement.id),
      key: achievement.key ?? null,
      title: achievement.title,
      description: achievement.description ?? null,
      category: achievement.category ?? null,
      image: achievement.image ?? null,
      awardedAt: achievement.awardedAt ?? null,
      context: achievement.context ?? null,
    };
  }

  private mapTransaction(transaction: TransaccionPulse): TransaccionPulse {
    return {
      id: transaction.id,
      currency: transaction.currency,
      type: transaction.type,
      amount: this.number(transaction.amount),
      signedAmount: Number(transaction.signedAmount) || 0,
      resultingBalance: this.number(transaction.resultingBalance),
      sourceType: transaction.sourceType ?? null,
      sourceId: transaction.sourceId ?? null,
      reason: transaction.reason ?? null,
      metadata: transaction.metadata ?? null,
      occurredAt: transaction.occurredAt ?? null,
    };
  }

  private number(value: number | undefined, fallback = 0): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  private percent(value: number): number {
    return Math.min(100, Math.max(0, this.number(value)));
  }

  private studentId(): number | null {
    const usuario = this.sesion.usuario();
    return usuario?.rol === 'alumno' ? usuario.id : null;
  }
}
