import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavegacionApp } from './navegacion-app';

describe('NavegacionApp', () => {
  let eventos: Subject<unknown>;
  let servicio: NavegacionApp;

  beforeEach(() => {
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

  afterEach(() => servicio.detener());

  it('activa el indicador desde el primer evento de navegacion', () => {
    eventos.next(new NavigationStart(1, '/alumno/herramientas'));

    expect(servicio.activa()).toBe(true);
  });

  it.each([
    new NavigationEnd(1, '/alumno/herramientas', '/alumno/herramientas'),
    new NavigationCancel(2, '/alumno/perfil', 'cancelada'),
    new NavigationError(3, '/alumno/ranking', new Error('chunk')),
  ])('oculta el indicador al finalizar o interrumpir la navegacion', (evento) => {
    eventos.next(new NavigationStart(1, '/alumno/herramientas'));
    eventos.next(evento);

    expect(servicio.activa()).toBe(false);
  });

  it('no duplica suscripciones si iniciar se llama mas de una vez', () => {
    servicio.iniciar();
    expect(eventos.observed).toBe(true);

    servicio.detener();
    expect(eventos.observed).toBe(false);
  });
});
