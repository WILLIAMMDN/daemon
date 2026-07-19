import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/servicios/api';
import { Sesion } from '../../../../core/servicios/sesion';
import { CuentoRegistro } from '../../models/cuento.models';
import { Cuento } from '../../services/cuento';
import { GaleriaProyectos } from './galeria-proyectos';

const cuentos: CuentoRegistro[] = [
  {
    id: 10,
    id_alumno: 7,
    titulo: 'La estrella azul',
    autor: 'Luna Creadora',
    fecha_creacion: '2026-07-18T10:00:00Z',
    img_1: 'uploads/cuentos/estrella.webp',
    data_1: '{"bubbles":[{"text":"Hola"}],"chars":[]}',
  },
  {
    id: 11,
    id_alumno: 8,
    titulo: 'El bosque amable',
    autor: 'Mateo Ruiz',
    fecha_creacion: '2026-07-16T10:00:00Z',
    data_1: '{"bubbles":[],"chars":[]}',
  },
];

describe('GaleriaProyectos', () => {
  const listarMock = jest.fn();
  const mioMock = jest.fn();

  beforeEach(async () => {
    listarMock.mockReset().mockReturnValue(of(cuentos));
    mioMock.mockReset().mockReturnValue(of(cuentos[0]));

    await TestBed.configureTestingModule({
      imports: [GaleriaProyectos],
      providers: [
        provideRouter([]),
        { provide: Cuento, useValue: { listar: listarMock, mio: mioMock } },
        { provide: Sesion, useValue: { usuario: signal({ id: 7 }) } },
      ],
    }).compileComponents();
  });

  it('presenta sólo datos recibidos, portadas pendientes explícitas y rutas nuevas', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main')).toBeNull();
    expect(element.querySelectorAll('.story-card')).toHaveLength(2);
    expect(element.querySelector('.story-stats-card')?.textContent).toContain('2');
    expect(element.querySelector('[data-asset-name="story-11-cover.webp"]')).toBeTruthy();
    expect(element.querySelector<HTMLAnchorElement>('a[href="/alumno/proyectos/cuentos/10"]')).toBeTruthy();
    expect(element.textContent).not.toContain('Reacciones');
    expect(element.textContent).not.toContain('Destacados');
  });

  it('filtra por propiedad y búsqueda sin categorías inventadas', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const filtroMio = Array.from(element.querySelectorAll<HTMLButtonElement>('.story-filters button'))
      .find((button) => button.textContent?.includes('Mi cuento'));

    filtroMio?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.story-card')).toHaveLength(1);
    expect(element.querySelector('.story-card h2')?.textContent).toContain('La estrella azul');

    fixture.componentInstance.seleccionarFiltro('todos');
    const search = element.querySelector<HTMLInputElement>('.story-search input');
    if (!search) throw new Error('No se encontró el buscador de historias');
    search.value = 'bosque';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.story-card')).toHaveLength(1);
    expect(element.querySelector('.story-card h2')?.textContent).toContain('El bosque amable');
  });

  it('no confunde un error de conexión con una galería vacía', () => {
    listarMock.mockReturnValue(throwError(() => new ApiError('offline', 'Sin conexión')));
    mioMock.mockReturnValue(of(null));
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.story-load-error')?.textContent).toContain('No pudimos abrir la galería');
    expect(element.querySelector('app-estado-vacio')).toBeNull();
  });
});
