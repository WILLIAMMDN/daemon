import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { concat, of, Subject, throwError } from 'rxjs';
import { Api, ApiError } from '../../../../core/servicios/api';
import { Recursos } from './recursos';

const respuesta = {
  cursos: [
    {
      id: 1,
      titulo: 'Pensamiento computacional',
      descripcion: 'Resuelve problemas paso a paso.',
      nivel: 'KIDS',
      unidades: [
        {
          id: 11,
          titulo: 'Secuencias',
          lecciones: [
            { id: 111, titulo: 'Primer algoritmo', duracion_minutos: 15, progresos: [] },
          ],
        },
      ],
    },
    {
      id: 2,
      titulo: 'Ciudadanía digital',
      nivel: 'TEENS',
      unidades: [
        {
          id: 21,
          titulo: 'Privacidad',
          lecciones: [
            { id: 211, titulo: 'Datos personales', progresos: [{ estado: 'completed', porcentaje: 100 }] },
            { id: 212, titulo: 'Contraseñas seguras', progresos: [] },
          ],
        },
      ],
    },
    {
      id: 3,
      titulo: 'Introducción a IA',
      nivel: 'TEENS',
      unidades: [
        {
          id: 31,
          titulo: 'Modelos',
          lecciones: [
            { id: 311, titulo: 'Qué aprende una IA', progresos: [{ estado: 'completed', porcentaje: 100 }] },
          ],
        },
      ],
    },
  ],
  resumen: { cursos: 3, lecciones: 4, completadas: 2, porcentaje: 50 },
};

describe('Recursos', () => {
  const getMock = jest.fn();
  const putMock = jest.fn();
  const postMock = jest.fn();

  beforeEach(async () => {
    getMock.mockReset().mockReturnValue(of(respuesta));
    putMock.mockReset().mockReturnValue(of({ estado: 'completed', porcentaje: 100 }));
    postMock.mockReset().mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [Recursos],
      providers: [
        provideRouter([]),
        { provide: Api, useValue: { get: getMock, put: putMock, post: postMock } },
      ],
    }).compileComponents();
  });

  it('presenta el catálogo con filtros reales, aside coherente y slots de ilustración', () => {
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Mis cursos');
    expect(element.querySelectorAll('.course-card')).toHaveLength(3);
    expect(element.querySelectorAll('daemon-illustration-slot').length).toBeGreaterThanOrEqual(4);
    expect(element.querySelector('.course-summary-card')?.textContent).toContain('En progreso');
    expect(element.querySelector('.course-summary-card')?.textContent).toContain('Completados');
    expect(element.querySelectorAll('[role="progressbar"]')).toHaveLength(4);

    element.querySelector<HTMLButtonElement>('.course-refresh-action')?.click();
    expect(getMock).toHaveBeenLastCalledWith('/alumno/aprendizaje', { fresh: true });
  });

  it('filtra por estado y búsqueda sin inventar categorías del backend', () => {
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const enProgreso = Array.from(element.querySelectorAll<HTMLButtonElement>('.course-filter'))
      .find((button) => button.textContent?.includes('En progreso'));

    enProgreso?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.course-card')).toHaveLength(1);
    expect(element.querySelector('.course-card h2')?.textContent).toContain('Ciudadanía digital');

    const search = element.querySelector<HTMLInputElement>('.course-search input');
    if (!search) throw new Error('No se encontró el buscador de cursos');
    search.value = 'algoritmo';
    search.dispatchEvent(new Event('input'));
    fixture.componentInstance.seleccionarFiltro('all');
    fixture.detectChanges();

    expect(element.querySelectorAll('.course-card')).toHaveLength(1);
    expect(element.querySelector('.course-card h2')?.textContent).toContain('Pensamiento computacional');
  });

  it('muestra un blank slate ilustrado cuando todavía no hay asignaciones', () => {
    getMock.mockReturnValue(of({
      cursos: [],
      resumen: { cursos: 0, lecciones: 0, completadas: 0, porcentaje: 0 },
    }));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const estadoVacio = element.querySelector('.course-empty-state');
    expect(estadoVacio?.textContent).toContain('Tu aprendizaje está preparándose');
    expect(estadoVacio?.querySelector<HTMLImageElement>('.empty-state__art img')?.getAttribute('src'))
      .toBe('/img/empty/empty-robot.webp');
    expect(estadoVacio?.querySelector('.ant-btn-primary')?.textContent).toContain('Actualizar cursos');
    expect(element.querySelector('.course-summary-card')?.textContent).toContain('Aún no tienes cursos asignados');
  });

  it('diferencia falta de conexión de un estado vacío académico', () => {
    getMock.mockReturnValue(throwError(() => new ApiError('offline', 'Sin conexión')));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.course-load-error')?.getAttribute('data-problem')).toBe('offline');
    expect(element.querySelector('.course-load-error h2')?.textContent).toContain('Sin conexión con DAEMON');
    expect(element.querySelector('.course-empty-state')).toBeNull();
  });

  it('ofrece una salida segura cuando el backend deniega acceso', () => {
    getMock.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.course-load-error')?.getAttribute('data-problem')).toBe('permission');
    expect(element.querySelector('.course-load-error h2')?.textContent).toContain('Acceso no disponible');
    expect(element.querySelector<HTMLAnchorElement>('.course-load-error a')?.getAttribute('href')).toBe('/alumno');
  });

  it('conserva y etiqueta los datos anteriores cuando falla una actualización', () => {
    getMock
      .mockReturnValueOnce(of(respuesta))
      .mockReturnValueOnce(throwError(() => new ApiError('timeout', 'Tiempo agotado')));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();

    fixture.componentInstance.cargar(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.course-card')).toHaveLength(3);
    expect(element.querySelector('.course-alert')?.getAttribute('data-problem')).toBe('timeout');
    expect(element.querySelector('.course-stale')?.textContent).toContain('Datos guardados');
  });

  it('muestra la respuesta cacheada mientras la revalidación continúa en segundo plano', () => {
    const actualizacion = new Subject<typeof respuesta>();
    getMock.mockReturnValue(concat(of(respuesta), actualizacion));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.course-loading')).toBeNull();
    expect(element.querySelectorAll('.course-card')).toHaveLength(3);
    expect(fixture.componentInstance.refrescando()).toBe(true);

    actualizacion.next(respuesta);
    actualizacion.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance.refrescando()).toBe(false);
  });

  it('actualiza el progreso local y conserva telemetría permitida al completar', () => {
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const leccion = fixture.componentInstance.cursosVista()[0].unidades[0].lecciones[0];

    fixture.componentInstance.completar(leccion);
    fixture.detectChanges();

    expect(putMock).toHaveBeenCalledWith('/alumno/aprendizaje/lecciones/111/progreso', {
      estado: 'completed',
      porcentaje: 100,
    });
    expect(fixture.componentInstance.datos()?.resumen.completadas).toBe(3);
    expect(postMock).toHaveBeenCalledWith('/telemetria/eventos', {
      nombre: 'lesson_completed',
      propiedades: { lesson_id: 111, module: 'cursos' },
    });
    expect((fixture.nativeElement as HTMLElement).querySelector('.course-success')?.textContent)
      .toContain('La lección Primer algoritmo quedó completada');
  });

  it('separa un fallo al guardar de los errores de carga y no ofrece un reintento engañoso', () => {
    putMock.mockReturnValue(throwError(() => new ApiError('offline', 'Sin conexión')));
    const fixture = TestBed.createComponent(Recursos);
    fixture.detectChanges();
    const leccion = fixture.componentInstance.cursosVista()[0].unidades[0].lecciones[0];

    fixture.componentInstance.completar(leccion);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.course-alert--action')?.textContent).toContain('No guardamos el avance');
    expect(element.querySelector('.course-alert--action')?.textContent).toContain('volver a intentarlo desde la lección');
    expect(element.querySelector('.course-alert--action')?.textContent).not.toContain('Reintentar');
  });
});
