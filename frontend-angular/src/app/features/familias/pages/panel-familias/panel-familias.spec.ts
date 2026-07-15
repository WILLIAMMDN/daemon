import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Sesion, UsuarioSesion } from '../../../../core/servicios/sesion';
import { PanelFamiliasDto } from '../../models/familias.model';
import { Familias } from '../../services/familias';
import { PanelFamilias } from './panel-familias';

const tutor: UsuarioSesion = {
  id: 90,
  nombre_completo: 'Ana Familiar',
  email: 'ana@example.com',
  email_verificado: true,
  rol: 'tutor',
  tokens: 0,
};

const panel: PanelFamiliasDto = {
  tutor: { nombre: 'Ana Familiar', email: 'ana@example.com' },
  hijos: [{ id: 7, nombre: 'Luna Estudiante', nivel: 'KIDS', parentesco: 'madre', aula: 'Exploradores' }],
  invitaciones_pendientes: 0,
  seleccionado: {
    alumno: {
      id: 7,
      nombre: 'Luna Estudiante',
      nivel: 'KIDS',
      experiencia: 250,
      nivel_gamificacion: 2,
      posicion: 2,
      posicion_scope_label: 'Tu aula',
      progreso_nivel: { progreso_porcentaje: 75, experiencia_restante: 50 },
    },
    semana: {
      misiones_aprobadas: 2,
      xp_aprendizaje: 90,
      evaluaciones_enviadas: 1,
      promedio_evaluaciones: 18,
      actividad: [
        { fecha: '2026-07-09', etiqueta: 'jue', activo: false },
        { fecha: '2026-07-10', etiqueta: 'vie', activo: false },
        { fecha: '2026-07-11', etiqueta: 'sab', activo: false },
        { fecha: '2026-07-12', etiqueta: 'dom', activo: false },
        { fecha: '2026-07-13', etiqueta: 'lun', activo: true },
        { fecha: '2026-07-14', etiqueta: 'mar', activo: true },
        { fecha: '2026-07-15', etiqueta: 'mie', activo: false },
      ],
      ultimas_misiones: [{ titulo: 'Privacidad digital', xp: 40, fecha: '2026-07-14' }],
    },
    bienestar_digital: {
      activo: true,
      bloqueado: false,
      motivo: null,
      fecha_local: '2026-07-15',
      zona_horaria: 'America/Lima',
      minutos_usados: 22,
      max_minutos_diarios: 90,
      minutos_restantes: 68,
      hora_silencio_inicio: '21:00:00',
      hora_silencio_fin: '07:00:00',
    },
    membresia: {
      plan: 'Plan KIDS',
      estado: 'activa',
      importe_centimos: 9900,
      moneda: 'PEN',
      portal_pago_url: null,
      soporte_email: 'soporte@example.com',
      maneja_tarjetas_daemon: false,
    },
  },
};

describe('PanelFamilias', () => {
  const usuario = signal<UsuarioSesion | null>(tutor);
  const panelMock = jest.fn(() => of(panel));
  const invitacionesMock = jest.fn(() => of({ invitaciones: [] }));
  const actualizarLimiteMock = jest.fn(() => of({ bienestar_digital: panel.seleccionado!.bienestar_digital }));

  beforeEach(async () => {
    usuario.set(tutor);
    panelMock.mockClear();
    invitacionesMock.mockClear();
    actualizarLimiteMock.mockClear();

    await TestBed.configureTestingModule({
      imports: [PanelFamilias],
      providers: [
        { provide: Sesion, useValue: { usuario } },
        { provide: Familias, useValue: {
          panel: panelMock,
          invitaciones: invitacionesMock,
          actualizarLimite: actualizarLimiteMock,
          aceptarInvitacion: jest.fn(),
        } },
      ],
    }).compileComponents();
  });

  it('no solicita datos del menor antes de verificar el correo del adulto', () => {
    usuario.set({ ...tutor, email_verificado: false });
    const fixture = TestBed.createComponent(PanelFamilias);
    fixture.detectChanges();

    expect(panelMock).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Verifica tu correo familiar');
  });

  it('muestra progreso, ranking, bienestar y membresia sin saldo DAEMONS', () => {
    const fixture = TestBed.createComponent(PanelFamilias);
    fixture.detectChanges();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('75');
    expect(elemento.textContent).toContain('XP aprendido esta semana');
    expect(elemento.textContent).toContain('Posición en tu aula');
    expect(elemento.textContent).toContain('Bienestar digital');
    expect(elemento.textContent).toContain('Plan KIDS');
    expect(elemento.textContent).not.toContain('Saldo DAEMONS');
  });

  it('guarda un limite solo para el alumno seleccionado', () => {
    const fixture = TestBed.createComponent(PanelFamilias);
    fixture.detectChanges();
    fixture.componentInstance.guardarLimite();

    expect(actualizarLimiteMock).toHaveBeenCalledWith(7, expect.objectContaining({
      activo: true,
      max_minutos_diarios: 90,
      zona_horaria: 'America/Lima',
    }));
  });
});
