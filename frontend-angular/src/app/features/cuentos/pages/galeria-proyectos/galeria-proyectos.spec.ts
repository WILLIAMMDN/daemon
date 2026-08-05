import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sesion } from '../../../../core/servicios/sesion';
import { GaleriaCuentosFacade } from '../../aplicacion/galeria-cuentos.facade';
import { Cuento, VERSION_ESQUEMA_CUENTO } from '../../dominio/cuento.modelo';
import { GaleriaProyectos } from './galeria-proyectos';

const instante = { milisegundos: 1_753_000_000_000 };
const cuentos: Cuento[] = [
  {
    id: 'cuento-10',
    autorUid: 'uid-7',
    autorUsuarioId: 7,
    autor: { nombre: 'Luna Creadora', avatarRef: null },
    titulo: 'La estrella azul',
    descripcion: '',
    portadaRef: 'uploads/cuentos/estrella.webp',
    categoria: 'Aventura',
    rangoEdad: '9 - 12 años',
    paginasBorrador: 2,
    palabras: 50,
    estado: 'borrador',
    visibilidad: 'privado',
    audiencia: 'KIDS',
    moderacion: 'no_solicitada',
    estadisticas: { comentarios: 0, reacciones: 0, lecturas: 0 },
    versionBorradorId: 'version-10',
    versionPublicadaId: null,
    creadoEn: instante,
    actualizadoEn: instante,
    publicadoEn: null,
    schemaVersion: VERSION_ESQUEMA_CUENTO,
  },
  {
    id: 'cuento-11',
    autorUid: 'uid-8',
    autorUsuarioId: 8,
    autor: { nombre: 'Mateo Ruiz', avatarRef: null },
    titulo: 'El bosque amable',
    descripcion: '',
    portadaRef: null,
    categoria: 'Fábula',
    rangoEdad: '9 - 12 años',
    paginasBorrador: 1,
    palabras: 30,
    estado: 'publicado',
    visibilidad: 'comunidad',
    audiencia: 'KIDS',
    moderacion: 'aprobado',
    estadisticas: { comentarios: 1, reacciones: 2, lecturas: 3 },
    versionBorradorId: 'version-11',
    versionPublicadaId: 'version-11',
    creadoEn: instante,
    actualizadoEn: { milisegundos: instante.milisegundos - 1000 },
    publicadoEn: instante,
    schemaVersion: VERSION_ESQUEMA_CUENTO,
  },
];

describe('GaleriaProyectos', () => {
  const facade = {
    cuentos: signal<readonly Cuento[]>(cuentos),
    propios: signal<readonly Cuento[]>([cuentos[0]]),
    cargando: signal(false),
    cargandoPropios: signal(false),
    refrescando: signal(false),
    error: signal(''),
    datosConservados: signal(false),
    hayMas: computed(() => false),
    reaccionesPropiasTotal: signal(0),
    cargar: jest.fn().mockResolvedValue(undefined),
    cargarPropios: jest.fn().mockResolvedValue(undefined),
    cargarMas: jest.fn().mockResolvedValue(undefined),
    eliminar: jest.fn().mockResolvedValue(true),
    resolverActivo: (referencia: string | null) => referencia ? `/${referencia}` : '',
  };

  beforeEach(async () => {
    facade.cuentos.set(cuentos);
    facade.propios.set([cuentos[0]]);
    facade.cargando.set(false);
    facade.error.set('');
    facade.cargar.mockClear();

    await TestBed.configureTestingModule({
      imports: [GaleriaProyectos],
      providers: [
        provideRouter([]),
        { provide: Sesion, useValue: { usuario: signal({ id: 7, nombre_completo: 'Luna Creadora' }) } },
      ],
    })
      .overrideComponent(GaleriaProyectos, {
        set: { providers: [{ provide: GaleriaCuentosFacade, useValue: facade }] },
      })
      .compileComponents();
  });

  it('presenta resultados paginados y distingue el cuento propio por UID resuelto en aplicación', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.story-card')).toHaveLength(2);
    expect(element.querySelector('.story-progress-stats')?.textContent).toContain('2');
    expect(element.querySelector('[data-asset-name="story-cuento-11-cover.webp"]')).toBeTruthy();
    expect(element.querySelector<HTMLAnchorElement>('a[href="/alumno/proyectos/cuentos/cuento-10"]')).toBeTruthy();
    expect(facade.cargar).toHaveBeenCalledTimes(1);
  });

  it('filtra por propiedad y búsqueda sin inventar categorías', () => {
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    fixture.componentInstance.seleccionarFiltro('mio');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.story-card')).toHaveLength(1);

    fixture.componentInstance.seleccionarFiltro('todos');
    fixture.componentInstance.actualizarBusqueda('bosque');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.story-card')).toHaveLength(1);
    expect(element.querySelector('.story-card h2')?.textContent).toContain('El bosque amable');
  });

  it('no confunde un error de conexión con una galería vacía', () => {
    facade.cuentos.set([]);
    facade.propios.set([]);
    facade.error.set('Sin conexión. Conservamos el contenido visible.');
    const fixture = TestBed.createComponent(GaleriaProyectos);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.story-load-error')).toBeTruthy();
  });
});
