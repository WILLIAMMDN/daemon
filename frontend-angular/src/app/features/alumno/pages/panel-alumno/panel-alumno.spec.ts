import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/servicios/api';
import { Activos } from '../../../../core/servicios/activos';
import { Sesion } from '../../../../core/servicios/sesion';
import { PanelAlumnoDto } from '../../models/panel-alumno.model';
import { Alumno } from '../../services/alumno';
import { PanelAlumno } from './panel-alumno';

const panel: PanelAlumnoDto = {
  usuario: {
    id: 7,
    nombre_completo: 'Luna Estudiante',
    usuario: 'luna',
    rol: 'alumno',
    nivel: 'KIDS',
    tokens: 80,
    experiencia: 250,
    nivel_gamificacion: 2,
    progreso_nivel: {
      nivel: 2,
      nivel_maximo: 100,
      experiencia_total: 250,
      experiencia_nivel: 150,
      experiencia_meta: 200,
      experiencia_restante: 50,
      progreso_porcentaje: 75,
    },
  },
  posicion: 2,
  posicion_scope: 'aula',
  posicion_scope_label: 'Tu aula',
  misiones_pendientes: 1,
  misiones_completadas: 3,
  insignias: 2,
  canjes_pendientes: 0,
  racha: 1,
  actividad_semana: [
    { fecha: '2026-07-09', etiqueta: 'jue', activo: false, tipo: null },
    { fecha: '2026-07-10', etiqueta: 'vie', activo: false, tipo: null },
    { fecha: '2026-07-11', etiqueta: 'sab', activo: false, tipo: null },
    { fecha: '2026-07-12', etiqueta: 'dom', activo: false, tipo: null },
    { fecha: '2026-07-13', etiqueta: 'lun', activo: false, tipo: null },
    { fecha: '2026-07-14', etiqueta: 'mar', activo: false, tipo: null },
    { fecha: '2026-07-15', etiqueta: 'mie', activo: true, tipo: 'mision' },
  ],
  proxima_mision: {
    id: 10,
    titulo: 'Privacidad digital',
    recompensa: 50,
    tipo_evidencia: 'texto',
    nivel_requerido: 'KIDS',
  },
  progreso_nivel: {
    nivel: 2,
    nivel_maximo: 100,
    experiencia_total: 250,
    experiencia_nivel: 150,
    experiencia_meta: 200,
    experiencia_restante: 50,
    progreso_porcentaje: 75,
  },
};

describe('PanelAlumno', () => {
  const panelMock = jest.fn();
  const sesionMock = {
    usuario: signal(panel.usuario),
    actualizarUsuario: jest.fn(),
  };

  beforeEach(async () => {
    localStorage.clear();
    panelMock.mockReset();
    sesionMock.actualizarUsuario.mockReset();
    panelMock.mockReturnValue(of(panel));

    await TestBed.configureTestingModule({
      imports: [PanelAlumno],
      providers: [
        provideRouter([]),
        { provide: Alumno, useValue: { panel: panelMock } },
        { provide: Sesion, useValue: sesionMock },
        { provide: Activos, useValue: { url: (ruta: string | null | undefined) => ruta ?? '' } },
      ],
    }).compileComponents();
  });

  it('presenta prioridad, ranking visible y progreso accesible sin main anidado', () => {
    const fixture = TestBed.createComponent(PanelAlumno);
    fixture.detectChanges();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('main')).toBeNull();
    expect(elemento.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    expect(elemento.querySelectorAll('.summary-tile')).toHaveLength(4);
    expect(elemento.querySelector('.summary-tile--violet small')?.textContent?.trim()).toBe('Tu aula');
    expect(elemento.querySelectorAll('.week-grid li')).toHaveLength(7);
    expect(elemento.querySelector('.next-mission-card h3')?.textContent?.trim()).toBe('Privacidad digital');
  });

  it('conserva el ultimo panel cuando falla una actualizacion', () => {
    panelMock
      .mockReturnValueOnce(of(panel))
      .mockReturnValueOnce(throwError(() => new ApiError('offline', 'sin conexion')));
    const fixture = TestBed.createComponent(PanelAlumno);
    fixture.detectChanges();

    fixture.componentInstance.cargar();
    fixture.detectChanges();

    expect(fixture.componentInstance.panel()).toEqual(panel);
    expect((fixture.nativeElement as HTMLElement).querySelector('.offline-notice')?.textContent).toContain('progreso sigue aquí');
  });
});
