import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sesion } from '../../../../core/servicios/sesion';
import { Herramientas } from './herramientas';

describe('Herramientas', () => {
  it('presenta el nivel real y conserva una ruta navegable por estación', async () => {
    await TestBed.configureTestingModule({
      imports: [Herramientas],
      providers: [
        provideRouter([]),
        {
          provide: Sesion,
          useValue: {
            usuario: signal({ nivel_gamificacion: 6 }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Herramientas);
    fixture.detectChanges();

    const nivel = fixture.nativeElement.querySelector('.lab-metric strong') as HTMLElement;
    const enlaces = Array.from(fixture.nativeElement.querySelectorAll('[data-lab-route]')) as HTMLAnchorElement[];

    expect(nivel.textContent?.trim()).toBe('6');
    expect(enlaces).toHaveLength(fixture.componentInstance.herramientas.length);
    expect(enlaces.every((enlace) => enlace.getAttribute('href')?.startsWith('/alumno/'))).toBe(true);
  });
});
