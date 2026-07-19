import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavegacionApp } from './navegacion-app';

describe('NavegacionApp', () => {
  let eventos: Subject<unknown>;
  let servicio: NavegacionApp;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T00:00:00Z'));
    eventos = new Subject<unknown>();
    TestBed.configureTestingModule({
      providers: [
        NavegacionApp,
        { provide: Router, useValue: { events: eventos } },
      ],
    });
    servicio = TestBed.inject(NavegacionApp);
    servicio.iniciar();
  });

  afterEach(() => {
    servicio.detener();
    jest.useRealTimers();
  });

  it('activa el indicador desde el primer evento de navegacion', () => {
    eventos.next(new NavigationStart(1, '/alumno/herramientas'));

    expect(servicio.activa()).toBe(true);
  });

  it.each([
    new NavigationEnd(1, '/alumno/herramientas', '/alumno/herramientas'),
    new NavigationCancel(2, '/alumno/perfil', 'cancelada'),
    new NavigationError(3, '/alumno/ranking', new Error('chunk')),
  ])('mantiene visible y luego oculta el indicador al finalizar o interrumpir la navegacion', (evento) => {
    eventos.next(new NavigationStart(1, '/alumno/herramientas'));
    eventos.next(evento);

    expect(servicio.activa()).toBe(true);
    jest.advanceTimersByTime(239);
    expect(servicio.activa()).toBe(true);
    jest.advanceTimersByTime(1);
    expect(servicio.activa()).toBe(false);
  });

  it('cancela el ocultado pendiente cuando comienza otra navegacion', () => {
    eventos.next(new NavigationStart(1, '/alumno/herramientas'));
    eventos.next(new NavigationEnd(1, '/alumno/herramientas', '/alumno/herramientas'));
    jest.advanceTimersByTime(120);

    eventos.next(new NavigationStart(2, '/alumno/recursos'));
    jest.advanceTimersByTime(120);
    expect(servicio.activa()).toBe(true);

    eventos.next(new NavigationEnd(2, '/alumno/recursos', '/alumno/recursos'));
    jest.advanceTimersByTime(119);
    expect(servicio.activa()).toBe(true);
    jest.advanceTimersByTime(1);
    expect(servicio.activa()).toBe(false);
  });

  it('no duplica suscripciones si iniciar se llama mas de una vez', () => {
    servicio.iniciar();
    expect(eventos.observed).toBe(true);

    servicio.detener();
    expect(eventos.observed).toBe(false);
  });
});
