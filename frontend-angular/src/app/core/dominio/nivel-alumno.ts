export const NIVELES_ALUMNO = ['KIDS', 'TEENS'] as const;

export type NivelAlumno = (typeof NIVELES_ALUMNO)[number];

export interface OpcionNivelAlumno {
  readonly valor: NivelAlumno;
  readonly etiqueta: string;
}

export const OPCIONES_NIVEL_ALUMNO: readonly OpcionNivelAlumno[] = [
  { valor: 'KIDS', etiqueta: 'KIDS' },
  { valor: 'TEENS', etiqueta: 'TEENS' },
];

export const NIVELES_CONTENIDO = ['TODOS', ...NIVELES_ALUMNO] as const;
export const CATEGORIAS_PREMIO = ['GENERAL', ...NIVELES_ALUMNO] as const;
export const NIVEL_ALUMNO_POR_DEFECTO: NivelAlumno = 'TEENS';

export function esNivelAlumno(nivel: unknown): nivel is NivelAlumno {
  return typeof nivel === 'string' && NIVELES_ALUMNO.includes(nivel as NivelAlumno);
}

export function normalizarNivelAlumno(nivel: unknown): NivelAlumno {
  return esNivelAlumno(nivel) ? nivel : NIVEL_ALUMNO_POR_DEFECTO;
}
