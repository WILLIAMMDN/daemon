import { PERFILES_EXPERIENCIA, perfilParaNivel } from './perfil-experiencia-estudiante';

describe('perfil de experiencia KIDS/TEENS', () => {
  it('expone ambos perfiles prefijados sin duplicar estructura', () => {
    expect(PERFILES_EXPERIENCIA.kids.audiencia).toBe('kids');
    expect(PERFILES_EXPERIENCIA.kids.densidad).toBe('comoda');
    expect(PERFILES_EXPERIENCIA.kids.navegacion).toBe('guiada');
    expect(PERFILES_EXPERIENCIA.teens.audiencia).toBe('teens');
    expect(PERFILES_EXPERIENCIA.teens.densidad).toBe('estandar');
    expect(PERFILES_EXPERIENCIA.teens.navegacion).toBe('autonoma');
  });

  it('mapea desde NivelAlumno y normaliza valores desconocidos', () => {
    expect(perfilParaNivel('KIDS')).toBe(PERFILES_EXPERIENCIA.kids);
    expect(perfilParaNivel('TEENS')).toBe(PERFILES_EXPERIENCIA.teens);
    expect(perfilParaNivel('DOCENTE')).toBe(PERFILES_EXPERIENCIA.teens);
    expect(perfilParaNivel(null)).toBe(PERFILES_EXPERIENCIA.teens);
  });

  it('los perfiles son inmutables y consistentes entre campos', () => {
    const kids = PERFILES_EXPERIENCIA.kids;
    expect(Object.isFrozen(kids)).toBe(true);
    expect(kids.tema).toBe(kids.audiencia);
    expect(kids.tonoContenido).toBe('infantil-claro');
    expect(PERFILES_EXPERIENCIA.teens.tonoContenido).toBe('juvenil-directo');
  });
});
