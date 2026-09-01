import { normalizarNivelAlumno } from '../../../../core/dominio/nivel-alumno';

/**
 * EXP-01 — Perfil de experiencia del dashboard del estudiante.
 *
 * Configuración EXCLUSIVAMENTE presentacional del panel-alumno:
 * traduce el nivel runtime del estudiante (KIDS/TEENS) a la dirección
 * de arte del dashboard. NO contiene datos de negocio (misiones, XP,
 * ranking, permisos) ni llamadas backend.
 *
 * La autoridad runtime del tema general sigue siendo
 * `core/dominio/tema-portal-alumno.ts`; este archivo solo resuelve
 * capacidades visuales del dashboard sin duplicar esa fuente.
 *
 * - KIDS → Explore: assets de hero APROBADOS, aún no implementados
 *   visualmente; la arquitectura ya puede resolverlos.
 * - TEENS → Creator: dirección artística aprobada para el content
 *   experience (bienvenida sobria + Creator Classes editoriales).
 *
 * NOTA: `heroAssets` está diseñado específicamente para la escena del
 * hero (background/ground/flag/monster/cloud). La colección editorial
 * Creator Classes NO usa ese campo: vive en `creatorClasses`, con
 * semántica propia (disciplinas editoriales, no pertenencia del
 * estudiante). No se mezclan los dos conceptos.
 */

export type StudentDashboardExperience = 'kids' | 'teens';

export interface StudentDashboardHeroAsset {
  /** Rol del asset dentro del escenario del hero. */
  readonly nombre: 'background' | 'ground' | 'flag' | 'monster' | 'cloud';
  /** Ruta pública del asset (carpeta `public/` del frontend). */
  readonly ruta: string;
}

/**
 * Card editorial de una Creator Class (TEENS · DESCUBRE).
 * Representa una DISCIPLINA para explorar, NO la clase de un estudiante.
 * Los colores oficiales viven en CSS por token (no aquí).
 */
export interface CreatorClassCard {
  /** Identificador editorial de la disciplina. */
  readonly id: 'code' | 'ai' | 'games' | 'maker';
  /** Nombre visible de la disciplina. */
  readonly nombre: string;
  /** Una línea editorial de la disciplina (solo copy, sin datos funcionales). */
  readonly descripcion: string;
  /** Ruta pública del bust aprobado (se muestra en placa neutra). */
  readonly rutaBust: string;
  /**
   * Microacento técnico (verde) bajo el nombre. Solo MAKER lo usa:
   * green-500 únicamente como microacento, nunca como color principal.
   */
  readonly microAcento?: boolean;
}

export interface StudentDashboardExperienceConfig {
  readonly experience: StudentDashboardExperience;
  /**
   * Clase modificadora del dashboard aplicada desde estado derivado
   * (base compartida + modifier), no mediante `:host-context`.
   */
  readonly claseModifier: 'student-dashboard--kids' | 'student-dashboard--teens';
  /** Assets aprobados del hero; `null` = sin dirección artística aprobada todavía. */
  readonly heroAssets: readonly StudentDashboardHeroAsset[] | null;
  /**
   * Creator Classes editoriales (solo TEENS · DESCUBRE); `null` = sin
   * colección (KIDS no la usa). No es pertenencia del estudiante.
   */
  readonly creatorClasses: readonly CreatorClassCard[] | null;
}

const ASSETS_HERO_KIDS: readonly StudentDashboardHeroAsset[] = [
  // Escenario integrado: montañas → nubes → terreno → bandera → personaje.
  { nombre: 'background', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-background.png' },
  { nombre: 'cloud', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-cloud-1.png' },
  { nombre: 'cloud', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-cloud-2.png' },
  { nombre: 'cloud', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-cloud-3.png' },
  { nombre: 'cloud', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-cloud-4.png' },
  { nombre: 'ground', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-ground.png' },
  { nombre: 'flag', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-flag.png' },
  { nombre: 'monster', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-monster.png' },
];

/** Assets editoriales aprobados TEENS-ASSET-01 (busts de disciplina). */
const CREATOR_CLASSES_TEENS: readonly CreatorClassCard[] = [
  {
    id: 'code',
    nombre: 'CODE',
    descripcion: 'Programa soluciones y da forma a tus ideas en código.',
    rutaBust: '/img/alumno/teens/creator-classes/code/code-bust.webp',
  },
  {
    id: 'ai',
    nombre: 'AI',
    descripcion: 'Entrena sistemas inteligentes que aprenden de los datos.',
    rutaBust: '/img/alumno/teens/creator-classes/ai/ai-bust.webp',
  },
  {
    id: 'games',
    nombre: 'GAMES',
    descripcion: 'Diseña mundos, retos y experiencias de juego.',
    rutaBust: '/img/alumno/teens/creator-classes/games/games-bust.webp',
  },
  {
    id: 'maker',
    nombre: 'MAKER',
    descripcion: 'Construye dispositivos y prototipos que funcionan.',
    rutaBust: '/img/alumno/teens/creator-classes/maker/maker-bust.webp',
    microAcento: true,
  },
];

const EXPERIENCIAS_DASHBOARD: Record<StudentDashboardExperience, StudentDashboardExperienceConfig> = {
  kids: {
    experience: 'kids',
    claseModifier: 'student-dashboard--kids',
    heroAssets: ASSETS_HERO_KIDS,
    creatorClasses: null,
  },
  teens: {
    experience: 'teens',
    claseModifier: 'student-dashboard--teens',
    // TEENS Creator: hero sobrio sin escena; la colección editorial son
    // las Creator Classes (busts aprobados).
    heroAssets: null,
    creatorClasses: CREATOR_CLASSES_TEENS,
  },
};

export function experienciaDashboard(nivel: unknown): StudentDashboardExperienceConfig {
  return EXPERIENCIAS_DASHBOARD[normalizarNivelAlumno(nivel) === 'KIDS' ? 'kids' : 'teens'];
}
