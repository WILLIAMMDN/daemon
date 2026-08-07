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
 * - TEENS → Creator: dirección artística propia; aún no hay assets
 *   aprobados, por lo que la configuración queda en `null` (se
 *   añadirán sin cambiar el modelo del componente).
 */

export type StudentDashboardExperience = 'kids' | 'teens';

export interface StudentDashboardHeroAsset {
  /** Rol del asset dentro del escenario del hero. */
  readonly nombre: 'background' | 'ground' | 'flag';
  /** Ruta pública del asset (carpeta `public/` del frontend). */
  readonly ruta: string;
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
}

const ASSETS_HERO_KIDS: readonly StudentDashboardHeroAsset[] = [
  { nombre: 'background', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-background.png' },
  { nombre: 'ground', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-ground.png' },
  { nombre: 'flag', ruta: '/img/alumno/dashboard/kids/daemon-dashboard-hero-flag.png' },
];

const EXPERIENCIAS_DASHBOARD: Record<StudentDashboardExperience, StudentDashboardExperienceConfig> = {
  kids: {
    experience: 'kids',
    claseModifier: 'student-dashboard--kids',
    heroAssets: ASSETS_HERO_KIDS,
  },
  teens: {
    experience: 'teens',
    claseModifier: 'student-dashboard--teens',
    // TEENS Creator: sin assets aprobados todavía. No inventar rutas.
    heroAssets: null,
  },
};

export function experienciaDashboard(nivel: unknown): StudentDashboardExperienceConfig {
  return EXPERIENCIAS_DASHBOARD[normalizarNivelAlumno(nivel) === 'KIDS' ? 'kids' : 'teens'];
}
