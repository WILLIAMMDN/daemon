import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { of } from 'rxjs';
import { CursoResponse, VersionResumen } from '../../models/studio.model';
import { StudioCurso } from './studio-curso';

const V1: VersionResumen = {
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
  author: { id: 3, name: 'Ana Autora' },
  publisher: { id: 3, name: 'Ana Autora' },
  pathCount: 1,
};

const CURSO: CursoResponse = {
  course: {
    id: 20,
    title: 'IA: Origen',
    code: 'IA-ORIGEN-TEENS',
    description: 'Entiende, dirige, verifica y crea con inteligencia artificial.',
    audience: 'TEENS',
    status: 'published',
    versionCount: 1,
    cohortCount: 1,
    publishedVersion: V1,
    draftVersion: null,
    versions: [V1],
  },
  generatedAt: '2026-09-03T12:00:00Z',
};

describe('DAEMON ARC — Studio course versions', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<StudioCurso>;

  const crear = (): ComponentFixture<StudioCurso> => {
    const creada = TestBed.createComponent(StudioCurso);
    creada.detectChanges();
    return creada;
  };

  const responder = (cuerpo: CursoResponse = CURSO): void => {
    httpMock.expectOne((peticion) => peticion.url.includes('/academico/studio/cursos/20')).flush(cuerpo);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudioCurso],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzI18n(es_ES),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ courseId: '20' })),
            snapshot: { paramMap: convertToParamMap({ courseId: '20' }) },
          },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders the real versions with their state and authoring provenance', () => {
    fixture = crear();
    responder();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('IA: Origen');
    expect(texto).toContain('V1 · IA_ORIGEN_TEENS_2026_V1');
    expect(texto).toContain('Publicada');
    expect(texto).toContain('Creada por Ana Autora');
    expect(texto).toContain('Publicada por Ana Autora');
  });

  it('offers a draft only for a version that is not editable', () => {
    fixture = crear();
    responder();

    const etiquetas = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).map((boton) => boton.textContent?.trim() ?? '');

    expect(etiquetas.some((etiqueta) => etiqueta.includes('Crear borrador'))).toBe(true);
    // La versión publicada se abre en modo lectura, no en edición.
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>,
    ).map((enlace) => enlace.textContent?.trim() ?? '');
    expect(enlaces).toContain('Ver');
    expect(enlaces).not.toContain('Editar');
  });

  it('creates a draft through the canonical endpoint and navigates to the new version', () => {
    fixture = crear();
    responder();

    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.crearBorrador(V1);

    const peticion = httpMock.expectOne((llamada) =>
      llamada.url.includes('/academico/studio/versiones/5/borrador'),
    );
    expect(peticion.request.method).toBe('POST');
    peticion.flush({ version: { ...V1, id: 6, number: 2, status: 'draft', editable: true } });

    expect(navegar).toHaveBeenCalledWith(['/docente/cursos', '20', 'version', 6]);
    expect(fixture.componentInstance.clonando()).toBeNull();
  });

  it('renders a 403 result when the actor belongs to another institution', () => {
    fixture = crear();

    httpMock
      .expectOne((peticion) => peticion.url.includes('/academico/studio/cursos/20'))
      .flush({ message: 'No puedes administrar cursos de otra institución.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.tipo).toBe('autorizacion');
    expect(fixture.nativeElement.querySelector('nz-result')).toBeTruthy();
  });

  it('shows an honest empty state when the course has no versions', () => {
    fixture = crear();
    responder({
      ...CURSO,
      course: { ...CURSO.course, versionCount: 0, publishedVersion: null, draftVersion: null, versions: [] },
    });

    expect(fixture.nativeElement.querySelector('nz-empty')).toBeTruthy();
  });
});
