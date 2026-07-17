import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { NzDropdownDirective } from 'ng-zorro-antd/dropdown';
import { Activos } from '../../servicios/activos';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { Sesion } from '../../servicios/sesion';
import { TopbarAlumno } from './topbar-alumno';

describe('TopbarAlumno', () => {
  const marcarTodasComoLeidas = jest.fn(() => ({ subscribe: jest.fn() }));
  const usuario = signal({
    nombre_completo: 'Estudiante de prueba',
    usuario: 'estudiante',
    rango: 'Novato',
    email_verificado: true,
    nivel_gamificacion: 2,
    tokens: 100,
    progreso_nivel: {
      experiencia_restante: 200,
      progreso_porcentaje: 40,
    },
  });
  const notificaciones = signal([]);
  const noLeidas = signal(2);

  beforeEach(async () => {
    marcarTodasComoLeidas.mockClear();
    await TestBed.configureTestingModule({
      imports: [TopbarAlumno],
      providers: [
        provideRouter([]),
        { provide: Sesion, useValue: { usuario } },
        { provide: Activos, useValue: { url: () => '' } },
        {
          provide: NotificacionesService,
          useValue: { notificaciones, noLeidas, marcarTodasComoLeidas },
        },
      ],
    }).compileComponents();
  });

  it('identifica y describe por separado los overlays de notificaciones y perfil', () => {
    const fixture = TestBed.createComponent(TopbarAlumno);
    fixture.detectChanges();
    const dropdowns = fixture.debugElement
      .queryAll(By.directive(NzDropdownDirective))
      .map((elemento) => elemento.injector.get(NzDropdownDirective));
    const botones = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button[nz-dropdown]'),
    );

    expect(dropdowns.map((dropdown) => dropdown.nzOverlayClassName)).toEqual([
      'student-notification-dropdown',
      'student-profile-dropdown',
    ]);
    expect(botones.map((boton) => boton.getAttribute('aria-haspopup'))).toEqual(['dialog', 'menu']);
    expect(botones.every((boton) => boton.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('mantiene un solo dropdown abierto y marca notificaciones solo al abrirlas', () => {
    const fixture = TestBed.createComponent(TopbarAlumno);
    const componente = fixture.componentInstance;

    componente.perfilMenuAbierto.set(true);
    componente.cambiarVisibilidadNotificaciones(true);

    expect(componente.notifMenuAbierto()).toBe(true);
    expect(componente.perfilMenuAbierto()).toBe(false);
    expect(marcarTodasComoLeidas).toHaveBeenCalledTimes(1);

    componente.cambiarVisibilidadNotificaciones(false);
    expect(marcarTodasComoLeidas).toHaveBeenCalledTimes(1);

    componente.notifMenuAbierto.set(true);
    componente.cambiarVisibilidadPerfil(true);
    expect(componente.perfilMenuAbierto()).toBe(true);
    expect(componente.notifMenuAbierto()).toBe(false);
  });

  it('cierra el overlay antes de navegar a todas las notificaciones', () => {
    const fixture = TestBed.createComponent(TopbarAlumno);
    const componente = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as Event;

    componente.notifMenuAbierto.set(true);
    componente.irANotificaciones(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(componente.notifMenuAbierto()).toBe(false);
    expect(navegar).toHaveBeenCalledWith('/alumno/notificaciones');
  });

  it('expone un botón real para abrir la navegación móvil', () => {
    const fixture = TestBed.createComponent(TopbarAlumno);
    const abrir = jest.spyOn(fixture.componentInstance.abrirMenuMovil, 'emit');
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.mobile-menu-trigger');
    boton?.click();

    expect(boton?.getAttribute('aria-label')).toBe('Abrir navegación');
    expect(boton?.querySelectorAll('span')).toHaveLength(3);
    expect(abrir).toHaveBeenCalledTimes(1);
  });
});
