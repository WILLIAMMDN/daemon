/**
 * DAEMON ARC — Modelos tipados para operaciones de revisión y retroalimentación docente.
 */

export interface AlumnoRevisionDto {
  id: number;
  name: string;
  username: string;
  level: string;
  avatar?: string | null;
}

export interface AulaRevisionDto {
  id: number;
  name: string;
  code?: string | null;
}

export interface CursoRevisionDto {
  id: number;
  title: string;
  version?: string | null;
}

export interface HitoRevisionDto {
  id: number;
  title: string;
  order: number;
}

export interface ObjetivoRevisionDto {
  id: number;
  code?: string | null;
  description: string;
}

export interface ExperienciaRevisionDto {
  id: number;
  title: string;
  type: string;
  order: number;
  summary?: string | null;
  content?: unknown;
  instructions?: Record<string, unknown> | null;
  objectives: ObjetivoRevisionDto[];
}

export interface ArtefactoRevisionDto {
  id: number;
  uuid: string;
  category: 'image' | 'document' | 'file' | 'external_link';
  originalName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  downloadUrl?: string | null;
  externalUrl?: string | null;
  checksumSha256?: string | null;
  registeredAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EvidenciaRevisionDto {
  id: number;
  type: string;
  reference: string;
  metadata?: Record<string, unknown> | null;
  registeredAt?: string | null;
  artifacts?: ArtefactoRevisionDto[];
}

export interface FeedbackRevisionDto {
  id: number;
  comment?: string | null;
  criteria?: Record<string, unknown> | null;
  authorName: string;
  registeredAt?: string | null;
}

export interface IntentoRevisionDto {
  id: number;
  uuid: string;
  attemptNumber: number;
  status: 'submitted' | 'evaluated' | string;
  score?: number | null;
  approved?: boolean | null;
  submittedAt?: string | null;
  evaluatedAt?: string | null;
  student: AlumnoRevisionDto;
  cohort: AulaRevisionDto;
  course: CursoRevisionDto;
  milestone: HitoRevisionDto;
  experience: ExperienciaRevisionDto;
  evidences: EvidenciaRevisionDto[];
  artifacts?: ArtefactoRevisionDto[];
  feedback: FeedbackRevisionDto[];
}

export interface EvaluacionIntentoPayload {
  aprobado: boolean;
  puntaje?: number | null;
  comentario?: string | null;
  criterios?: Record<string, string> | null;
}
