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
    expect(element.querySelector('.story-progress-stats')?.textContent).toContain('2');
    expect(element.querySelector('[data-asset-name="story-11-cover.webp"]')).toBeTruthy();
    expect(element.querySelector<HTMLAnchorElement>('a[href="/alumno/proyectos/cuentos/10"]')).toBeTruthy();
    // The hero carries two real CTAs: primary "Crear cuento" and a secondary "Volver a Proyectos".
    // No fake "Explorar historias" anchor, no overlay breadcrumb breaking the banner's alignment.
    const volverBtn = Array.from(element.querySelectorAll<HTMLAnchorElement>('.module-hero a'))
      .find((a) => a.textContent?.includes('Volver a Proyectos'));
    expect(volverBtn?.getAttribute('href')).toBe('/alumno/proyectos');
    expect(element.querySelector('a[href="#historias-publicadas"]')).toBeNull();
    expect(element.querySelector('.story-breadcrumb')).toBeNull();
    expect(element.textContent).not.toContain('Reacciones recibidas');
    expect(element.textContent).not.toContain('Destacados');
    expect(element.textContent).not.toContain('Favoritos');
    expect(element.textContent).not.toContain('Nuevos');
  });

  it('filtra por propiedad y búsqueda sin categorías inventadas', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const filtroMio = Array.from(element.querySelectorAll<HTMLButtonElement>('.story-filters button'))
      .find((button) => button.textContent?.includes('Mis historias'));

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

  it('expone un FAB para abrir el resumen creativo y lo cierra con la X o el overlay', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance;

    // Initial state: aside closed, FAB visible, overlay hidden.
    const aside = element.querySelector<HTMLElement>('.story-aside');
    const fab = element.querySelector<HTMLButtonElement>('.story-aside-fab');
    const overlay = element.querySelector<HTMLElement>('.story-aside-overlay');
    expect(aside).toBeTruthy();
    expect(fab).toBeTruthy();
    expect(overlay).toBeTruthy();
    expect(aside?.classList.contains('is-open')).toBe(false);
    expect(fab?.classList.contains('is-hidden')).toBe(false);
    expect(overlay?.classList.contains('is-visible')).toBe(false);
    expect(component.asideAbierto()).toBe(false);

    // Open via FAB.
    fab?.click();
    fixture.detectChanges();
    expect(component.asideAbierto()).toBe(true);
    expect(aside?.classList.contains('is-open')).toBe(true);
    expect(fab?.classList.contains('is-hidden')).toBe(true);
    expect(overlay?.classList.contains('is-visible')).toBe(true);

    // Close via the X button.
    const closeBtn = element.querySelector<HTMLButtonElement>('.story-aside-close');
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();
    fixture.detectChanges();
    expect(component.asideAbierto()).toBe(false);
    expect(aside?.classList.contains('is-open')).toBe(false);

    // Re-open, then close via overlay click.
    fab?.click();
    fixture.detectChanges();
    expect(component.asideAbierto()).toBe(true);
    overlay?.click();
    fixture.detectChanges();
    expect(component.asideAbierto()).toBe(false);
  });
});
