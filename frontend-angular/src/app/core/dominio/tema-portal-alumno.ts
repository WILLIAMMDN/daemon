import { NivelAlumno, normalizarNivelAlumno } from './nivel-alumno';

export interface TemaPortalAlumno {
  readonly nivel: NivelAlumno;
  readonly atributo: 'kids' | 'teens';
  readonly colorPrincipal: string;
  readonly colorPrincipalOscuro: string;
  readonly colorSuave: string;
  readonly colorBorde: string;
}

const TEMAS_PORTAL: Record<NivelAlumno, TemaPortalAlumno> = {
  KIDS: {
    nivel: 'KIDS',
    atributo: 'kids',
    // Colores KIDS recuperados de la identidad legacy; no cambia el layout.
    colorPrincipal: '#00b4d8',
    colorPrincipalOscuro: '#0077b6',
    colorSuave: '#e8f9fc',
    colorBorde: '#b8edf5',
  },
  TEENS: {
    nivel: 'TEENS',
    atributo: 'teens',
    // Conserva la identidad vigente del portal TEENS.
    colorPrincipal: '#1677ff',
    colorPrincipalOscuro: '#0958d9',
    colorSuave: '#edf5ff',
    colorBorde: '#cfe3ff',
  },
};

export function temaPortalAlumno(nivel: unknown): TemaPortalAlumno {
  return TEMAS_PORTAL[normalizarNivelAlumno(nivel)];
}
