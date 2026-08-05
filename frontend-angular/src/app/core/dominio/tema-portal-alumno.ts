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

/**
 * Paleta oficial del editor de cuentos (Quill). Colores del sistema
 * de diseño DAEMON (ver _tokens.scss): morados de la marca, dorado
 * de estrellas, semánticos y una gama cálida para ilustraciones
 * infantiles. Valores legítimos del token — este archivo es origen
 * (allowlist) del contrato de tokens.
 *
 * Quill NO rellena los selectores de color cuando la toolbar vive
 * fuera del editor (container externo); el componente los puebla
 * con esta paleta para que el autor solo elija colores de la marca.
 */
export const PALETA_QUILL_CUENTOS: readonly string[] = [
  // Sin color (por defecto)
  '',
  // Morados DAEMON
  '#5e34d7',
  '#7359c8',
  '#5730cf',
  '#7c3aed',
  '#a78bfa',
  '#c4b5fd',
  '#20113c',
  '#2c1654',
  // Dorado / estrellas
  '#ffc414',
  '#dca003',
  '#fff7d6',
  // Verdes
  '#12a150',
  '#22c55e',
  '#86efac',
  '#e7f8ef',
  // Azules
  '#1677ff',
  '#00b4d8',
  '#2563eb',
  '#dbeafe',
  // Cálidos
  '#f5a000',
  '#f97316',
  '#ec4899',
  '#f43f5e',
  '#b42331',
  '#ffe5e9',
  // Neutros
  '#0f172a',
  '#475569',
  '#64748b',
  '#94a3b8',
  '#cbd5e1',
  '#e2e8f0',
  '#f8fafc',
  '#ffffff',
];
