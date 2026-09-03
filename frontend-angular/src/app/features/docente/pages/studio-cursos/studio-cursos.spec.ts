import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { CursosResponse } from '../../models/studio.model';
import { StudioCursos } from './studio-cursos';

const CURSOS: CursosResponse = {
  courses: [
    {
      id: 20,
      title: 'IA: Origen',
      code: 'IA-ORIGEN-TEENS',
      description: 'Entiende, dirige, verifica y crea con inteligencia artificial.',
      audience: 'TEENS',
      status: 'published',
      versionCount: 2,
      cohortCount: 1,
      publishedVersion: {
        id: 5,
        uuid: 'uuid-v1',
        courseId: 20,
        number: 1,
        title: 'IA_ORIGEN_TEENS_2026_V1',
        description: null,
        audience: 'TEENS',
        difficulty: 'inicial',
        status: 'published',
        editable: false,
        publishedAt: '2026-08-01T00:00:00Z',
        archivedAt: null,
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        clonedFromVersionId: null,
        author: null,
        publisher: { id: 3, name: 'Ana Autora' },
        pathCount: 1,
      },
      draftVersion: {
        id: 6,
        uuid: 'uuid-v2',
        courseId: 20,
        number: 2,
        title: 'IA_ORIGEN_TEENS_2026_V2',
        description: null,
        audience: 'TEENS',
        difficulty: 'inicial',
        status: 'draft',
        editable: true,
        publishedAt: null,
        archivedAt: null,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        clonedFromVersionId: 5,
        author: { id: 3, name: 'Ana Autora' },
        publisher: null,
        pathCount: 1,
      },
      versions: [],
    },
  ],
  generatedAt: '2026-09-03T12:00:00Z',
};

describe('DAEMON ARC — Studio course list', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<StudioCursos>;

  const crear = (): ComponentFixture<StudioCursos> => {
    const creada = TestBed.createComponent(StudioCursos);
    creada.detectChanges();
    return creada;
  };

  const responder = (cuerpo: CursosResponse = CURSOS): void => {
    httpMock.expectOne((peticion) => peticion.url.includes('/academico/studio/cursos')).flush(cuerpo);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudioCursos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNzI18n(es_ES), provideRouter([])],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows a skeleton while the course catalogue loads', () => {
    fixture = crear();

    expect(fixture.nativeElement.querySelector('nz-skeleton')).toBeTruthy();
    responder();
  });

  it('renders real courses with their version state and no invented metrics', () => {
    fixture = crear();
    responder();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('IA: Origen');
    expect(texto).toContain('IA-ORIGEN-TEENS');
    expect(texto).toContain('TEENS');
    expect(texto).toContain('Publicada');
    expect(texto).toContain('Borrador');
    expect(texto).toContain('V1 · IA_ORIGEN_TEENS_2026_V1');
    expect(texto).toContain('V2 · IA_ORIGEN_TEENS_2026_V2');
    // Las cifras son las del backend, no un relleno.
    expect(fixture.componentInstance.cursos()[0].cohortCount).toBe(1);
    expect(fixture.componentInstance.cursos()[0].versionCount).toBe(2);
  });

  it('links each version to its editor route', () => {
    fixture = crear();
    responder();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>,
    ).map((enlace) => enlace.getAttribute('href'));

    expect(enlaces).toContain('/docente/cursos/20');
    expect(enlaces).toContain('/docente/cursos/20/version/5');
    expect(enlaces).toContain('/docente/cursos/20/version/6');
  });

  it('shows an honest empty state when the institution has no courses', () => {
    fixture = crear();
    responder({ courses: [], generatedAt: '2026-09-03T12:00:00Z' });

    expect(fixture.nativeElement.querySelector('nz-empty')).toBeTruthy();
    expect(fixture.componentInstance.sinCursos()).toBe(true);
  });

  it('renders a 403 result when the actor may not author courses', () => {
    fixture = crear();

    httpMock
      .expectOne((peticion) => peticion.url.includes('/academico/studio/cursos'))
      .flush({ message: 'Denegado' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.tipo).toBe('autorizacion');
    expect(fixture.nativeElement.querySelector('nz-result')).toBeTruthy();
  });

  it('offers a retry when the catalogue request fails', () => {
    fixture = crear();

    httpMock
      .expectOne((peticion) => peticion.url.includes('/academico/studio/cursos'))
      .flush({ message: 'Fallo interno' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.tipo).toBe('api');
    const alerta = fixture.nativeElement.querySelector('nz-alert');
    expect(alerta).toBeTruthy();

    fixture.componentInstance.cargar();
    fixture.detectChanges();
    responder();

    expect((fixture.nativeElement.textContent as string)).toContain('IA: Origen');
  });
});
