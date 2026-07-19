import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { concat, of, Subject, throwError } from 'rxjs';
import { ApiError } from '../../../../core/servicios/api';
import { ProyectosResponse } from '../../models/proyecto.models';
import { Proyecto } from '../../services/proyecto';
import { Proyectos } from './proyectos';

const respuesta: ProyectosResponse = {
  resumen: {
    areas_disponibles: 3,
    areas_exploradas: 2,
    proyectos_personales: 4,
  },
  categorias: [
    {
      slug: 'cuentos',
      nombre: 'Historias y cuentos',
      etiqueta: 'Narrativa digital',
      descripcion: 'Crea una historia por escenas.',
      ruta: '/alumno/proyectos/cuentos',
      accion: 'Explorar historias',
      metricas: [
        { valor: 1, etiqueta: 'cuento propio' },
        { valor: 8, etiqueta: 'historias en la galería' },
      ],
      tiene_actividad: true,
    },
    {
      slug: 'ia-aplicada',
      nombre: 'IA aplicada',
      etiqueta: 'Asistentes y modelos',
      descripcion: 'Configura tu bot educativo.',
      ruta: '/alumno/herramientas/bot',
      accion: 'Continuar mi bot',
      metricas: [
        { valor: 1, etiqueta: 'bot configurado' },
        { valor: 2, etiqueta: 'modelos guardados' },
      ],
      tiene_actividad: true,
    },
    {
      slug: 'laboratorio-ia',
      nombre: 'Laboratorio interactivo',
      etiqueta: 'Experimentación',
      descripcion: 'Prueba estrategias y observa resultados.',
      ruta: '/alumno/herramientas/laboratorio',
      accion: 'Entrar al laboratorio',
      metricas: [
        { valor: 0, etiqueta: 'episodios registrados' },
        { valor: null, etiqueta: 'mejor marca en pasos' },
      ],
      tiene_actividad: false,
    },
  ],
};

describe('Proyectos', () => {
  const catalogoMock = jest.fn();

  beforeEach(async () => {
    catalogoMock.mockReset().mockReturnValue(of(respuesta));

    await TestBed.configureTestingModule({
      imports: [Proyectos],
      providers: [
        provideRouter([]),
        { provide: Proyecto, useValue: { catalogo: catalogoMock } },
      ],
    }).compileComponents();
  });

  it('presenta categorías y métricas reales sin un main anidado', () => {
    const fixture = TestBed.createComponent(Proyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Mis proyectos');
    expect(element.querySelectorAll('app-tarjeta-categoria-proyecto')).toHaveLength(3);
    expect(element.querySelector('.projects-summary')?.textContent).toContain('4');
    expect(element.querySelector('.projects-grid')?.textContent).toContain('8');
    expect(element.querySelector<HTMLAnchorElement>('a[href="/alumno/proyectos/cuentos"]')).toBeTruthy();
    expect(element.querySelector('[data-asset-name="projects-hub-hero.webp"]')).toBeTruthy();
  });

  it('muestra la caché inmediatamente mientras revalida en segundo plano', () => {
    const actualizacion = new Subject<ProyectosResponse>();
    catalogoMock.mockReturnValue(concat(of(respuesta), actualizacion));
    const fixture = TestBed.createComponent(Proyectos);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.projects-loading')).toBeNull();
    expect(fixture.componentInstance.refrescando()).toBe(true);

    actualizacion.next(respuesta);
    actualizacion.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.refrescando()).toBe(false);
  });

  it('distingue un fallo de red de un catálogo realmente vacío', () => {
    catalogoMock.mockReturnValue(throwError(() => new ApiError('offline', 'Sin conexión')));
    const fixture = TestBed.createComponent(Proyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.projects-load-error')?.textContent).toContain('No pudimos abrir tus proyectos');
    expect(element.querySelector('app-estado-vacio')).toBeNull();
  });
});
