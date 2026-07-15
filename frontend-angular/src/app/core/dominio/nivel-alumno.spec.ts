import {
  CATEGORIAS_PREMIO,
  NIVELES_ALUMNO,
  NIVELES_CONTENIDO,
  normalizarNivelAlumno,
} from './nivel-alumno';
import { temaPortalAlumno } from './tema-portal-alumno';

describe('dominio de niveles de alumno', () => {
  it('expone unicamente KIDS y TEENS como niveles seleccionables', () => {
    expect(NIVELES_ALUMNO).toEqual(['KIDS', 'TEENS']);
    expect(NIVELES_CONTENIDO).toEqual(['TODOS', 'KIDS', 'TEENS']);
    expect(CATEGORIAS_PREMIO).toEqual(['GENERAL', 'KIDS', 'TEENS']);
  });

  it('normaliza cualquier nivel historico o desconocido a TEENS', () => {
    expect(normalizarNivelAlumno('PRO')).toBe('TEENS');
    expect(normalizarNivelAlumno('DOCENTE')).toBe('TEENS');
    expect(normalizarNivelAlumno('')).toBe('TEENS');
    expect(normalizarNivelAlumno(null)).toBe('TEENS');
  });

  it('resuelve un tema tecnico independiente para cada audiencia', () => {
    expect(temaPortalAlumno('KIDS').atributo).toBe('kids');
    expect(temaPortalAlumno('TEENS').atributo).toBe('teens');
    expect(temaPortalAlumno('KIDS').colorPrincipal).not.toBe(temaPortalAlumno('TEENS').colorPrincipal);
  });
});
