export type MonedaPulse = 'xp' | 'daemons' | string;

export type TipoTransaccionPulse = 'EARN' | 'SPEND' | 'ADJUSTMENT' | string;

export interface NivelPulse {
  current: number;
  maximum: number;
  xpWithinLevel: number;
  xpRequiredForNextLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface RachaPulse {
  current: number;
  longest: number;
  lastQualifyingDate: string | null;
  timezone: string;
}

export interface LogroPulse {
  id: number;
  key: string | null;
  title: string;
  description: string | null;
  category: string | null;
  image: string | null;
  awardedAt: string | null;
  context: unknown;
}

export interface TransaccionPulse {
  id: string;
  currency: MonedaPulse;
  type: TipoTransaccionPulse;
  amount: number;
  signedAmount: number;
  resultingBalance: number;
  sourceType: string | null;
  sourceId: number | string | null;
  reason: string | null;
  metadata: unknown;
  occurredAt: string | null;
}

export interface PulseSnapshot {
  level: NivelPulse;
  xpTotal: number;
  daemsBalance: number;
  streak: RachaPulse;
  recentAchievements: LogroPulse[];
  recentTransactions: TransaccionPulse[];
}

export interface PaginaTransaccionesPulse {
  items: TransaccionPulse[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export type EstadoCargaPulse = 'idle' | 'loading' | 'ready' | 'error';

export interface PulseSnapshotApi {
  level: NivelPulse;
  xp: { total: number };
  daems: { balance: number };
  streak: RachaPulse;
  recentAchievements?: LogroPulse[];
  recentTransactions?: TransaccionPulse[];
}

export interface PulseLogrosApi {
  data?: LogroPulse[];
}

export interface PulseTransaccionesApi {
  data?: TransaccionPulse[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}
