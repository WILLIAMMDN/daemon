import { NivelAlumno, normalizarNivelAlumno } from './nivel-alumno';

export interface TemaPortalAlumno {
  readonly nivel: NivelAlumno;
  readonly atributo: 'kids' | 'teens';
  /** Clase CSS que se aplica al host del layout. Sobreescribe --daemon-primary. */
  readonly claseTema: 'theme-kids' | 'theme-teens';
  /** @deprecated mantener por compatibilidad temporal; usar claseTema. */
  readonly colorPrincipal: string;
  /** @deprecated mantener por compatibilidad temporal; usar claseTema. */
  readonly colorPrincipalOscuro: string;
  /** @deprecated mantener por compatibilidad temporal; usar claseTema. */
  readonly colorSuave: string;
  /** @deprecated mantener por compatibilidad temporal; usar claseTema. */
  readonly colorBorde: string;
}

const TEMAS_PORTAL: Record<NivelAlumno, TemaPortalAlumno> = {
  KIDS: {
    nivel: 'KIDS',
    atributo: 'kids',
    claseTema: 'theme-kids',
    // Valores legacy — los layouts nuevos deberían leer de --daemon-*
    // (sobrescritos por la clase .theme-kids en _tokens.scss).
    colorPrincipal: '#00b4d8',
    colorPrincipalOscuro: '#0077b6',
    colorSuave: '#e8f9fc',
    colorBorde: '#b8edf5',
  },
  TEENS: {
    nivel: 'TEENS',
    atributo: 'teens',
    claseTema: 'theme-teens',
    colorPrincipal: '#1677ff',
    colorPrincipalOscuro: '#0958d9',
    colorSuave: '#edf5ff',
    colorBorde: '#cfe3ff',
  },
};

export function temaPortalAlumno(nivel: unknown): TemaPortalAlumno {
  return TEMAS_PORTAL[normalizarNivelAlumno(nivel)];
}
