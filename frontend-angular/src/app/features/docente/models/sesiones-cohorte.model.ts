/**
 * Operación docente de sesiones en vivo — contrato canónico del backend.
 *
 * Lectura:  GET  /academico/cohortes
 *           GET  /academico/aulas/{aula}/sesiones
 * Autoría:  POST /academico/aulas/{aula}/sesiones
 *           PUT  /academico/sesiones/{sesion}
 *
 * No se añade ningún campo que el backend no exponga.
 */

export type EstadoSesion = 'scheduled' | 'cancelled' | 'completed';

export interface CursoCohorteDto {
  id: number;
  title: string;
  code?: string | null;
  level?: string | null;
  status?: string | null;
}

export interface PeriodoCohorteDto {
  id: number;
  title: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface CohorteDto {
  id: number;
  name: string;
  code?: string | null;
  level?: string | null;
  course: CursoCohorteDto | null;
  period: PeriodoCohorteDto | null;
  activeStudentCount: number;
  scheduledSessionCount: number;
  nextSessionAt: string | null;
}

export interface CohortesResponse {
  cohorts: CohorteDto[];
  generatedAt: string;
}

export interface SesionCohorteDto {
  id: number;
  uuid: string;
  /** El dominio solo admite `live` hoy. */
  type: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  status: EstadoSesion | string;
  accessUrl: string | null;
  timing: 'upcoming' | 'past';
  /** Semana de entrega derivada de la primera sesión real de la cohorte. */
  deliveryWeek: number | null;
}

export interface SemanaEntregaDto {
  week: number;
  startsOn: string;
  sessions: SesionCohorteDto[];
}

export interface SesionesCohorteResponse {
  cohort: CohorteDto;
  range: { start: string | null; end: string | null };
  nextSession: SesionCohorteDto | null;
  upcoming: SesionCohorteDto[];
  past: SesionCohorteDto[];
  cancelled: SesionCohorteDto[];
  delivery: { anchorWeekStart: string | null; weeks: SemanaEntregaDto[] };
  generatedAt: string;
}

/** Payload aceptado por SesionAprendizajeRequest. */
export interface SesionPayload {
  titulo: string;
  descripcion?: string | null;
  inicio_at: string;
  fin_at?: string | null;
  acceso_url?: string | null;
  estado?: EstadoSesion;
}
