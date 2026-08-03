import { NivelAlumno, normalizarNivelAlumno } from './nivel-alumno';

export type AudienciaExperiencia = 'kids' | 'teens';
export type DensidadExperiencia = 'comoda' | 'estandar';
export type NavegacionExperiencia = 'guiada' | 'autonoma';
export type NivelAsistenciaExperiencia = 'alto' | 'medio';
export type FrecuenciaIlustracionExperiencia = 'alta' | 'selectiva';
export type MovimientoExperiencia = 'expresivo' | 'sutil';
export type TonoContenidoExperiencia = 'infantil-claro' | 'juvenil-directo';

/**
 * Contrato de experiencia KIDS/TEENS (ADR-005). Una sola aplicación;
 * la experiencia se resuelve por configuración, no duplicando páginas
 * ni servicios.
 */
export interface PerfilExperienciaEstudiante {
  readonly audiencia: AudienciaExperiencia;
  readonly tema: AudienciaExperiencia;
  readonly densidad: DensidadExperiencia;
  readonly navegacion: NavegacionExperiencia;
  readonly nivelAsistencia: NivelAsistenciaExperiencia;
  readonly frecuenciaIlustracion: FrecuenciaIlustracionExperiencia;
  readonly movimiento: MovimientoExperiencia;
  readonly tonoContenido: TonoContenidoExperiencia;
}

export const PERFIL_KIDS: PerfilExperienciaEstudiante = Object.freeze({
  audiencia: 'kids',
  tema: 'kids',
  densidad: 'comoda',
  navegacion: 'guiada',
  nivelAsistencia: 'alto',
  frecuenciaIlustracion: 'alta',
  movimiento: 'expresivo',
  tonoContenido: 'infantil-claro',
});

export const PERFIL_TEENS: PerfilExperienciaEstudiante = Object.freeze({
  audiencia: 'teens',
  tema: 'teens',
  densidad: 'estandar',
  navegacion: 'autonoma',
  nivelAsistencia: 'medio',
  frecuenciaIlustracion: 'selectiva',
  movimiento: 'sutil',
  tonoContenido: 'juvenil-directo',
});

export const PERFILES_EXPERIENCIA: Readonly<Record<AudienciaExperiencia, PerfilExperienciaEstudiante>> = Object.freeze({
  kids: PERFIL_KIDS,
  teens: PERFIL_TEENS,
});

export function esAudienciaExperiencia(valor: unknown): valor is AudienciaExperiencia {
  return valor === 'kids' || valor === 'teens';
}

export function perfilParaNivel(nivel: unknown): PerfilExperienciaEstudiante {
  const nivelNormalizado: NivelAlumno = normalizarNivelAlumno(nivel);
  return nivelNormalizado === 'KIDS' ? PERFIL_KIDS : PERFIL_TEENS;
}

export function perfilParaAudiencia(audiencia: unknown): PerfilExperienciaEstudiante {
  return esAudienciaExperiencia(audiencia) ? PERFILES_EXPERIENCIA[audiencia] : PERFIL_TEENS;
}
