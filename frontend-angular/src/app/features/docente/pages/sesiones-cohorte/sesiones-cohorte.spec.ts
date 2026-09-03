import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { CohortesResponse, SesionesCohorteResponse } from '../../models/sesiones-cohorte.model';
import { SesionesCohorteDocente } from './sesiones-cohorte';

const COHORTES: CohortesResponse = {
  cohorts: [
    {
      id: 7,
      name: 'IA: Origen Teens — Cohorte piloto',
      code: 'COH-IAO-01',
      level: 'TEENS',
      course: { id: 20, title: 'IA: Origen', code: 'IA-ORIGEN-TEENS', level: 'TEENS', status: 'published' },
      period: { id: 3, title: 'Cohorte 2026', startsOn: '2026-09-07', endsOn: '2026-10-18' },
      activeStudentCount: 14,
      scheduledSessionCount: 2,
      nextSessionAt: '2026-09-07T23:00:00Z',
    },
  ],
  generatedAt: '2026-09-02T15:00:00Z',
};

const SESIONES: SesionesCohorteResponse = {
  cohort: COHORTES.cohorts[0],
  range: { start: null, end: null },
  nextSession: {
    id: 91,
    uuid: 'uuid-91',
    type: 'live',
    title: 'Semana 1 — ¿La IA piensa?',
    description: 'Nota interna del docente.',
    startsAt: '2026-09-07T23:00:00Z',
    endsAt: '2026-09-08T00:30:00Z',
    durationMinutes: 90,
    status: 'scheduled',
    accessUrl: 'https://meet.example.test/ia-origen-s1',
    timing: 'upcoming',
    deliveryWeek: 1,
  },
  upcoming: [
    {
      id: 91,
      uuid: 'uuid-91',
      type: 'live',
      title: 'Semana 1 — ¿La IA piensa?',
      description: 'Nota interna del docente.',
      startsAt: '2026-09-07T23:00:00Z',
      endsAt: '2026-09-08T00:30:00Z',
      durationMinutes: 90,
      status: 'scheduled',
      accessUrl: 'https://meet.example.test/ia-origen-s1',
      timing: 'upcoming',
      deliveryWeek: 1,
    },
    {
      id: 92,
      uuid: 'uuid-92',
      type: 'live',
      title: 'Semana 2 — Datos y sesgo',
      description: null,
      startsAt: '2026-09-14T23:00:00Z',
      endsAt: '2026-09-15T00:30:00Z',
      durationMinutes: 90,
      status: 'scheduled',
      accessUrl: null,
      timing: 'upcoming',
      deliveryWeek: 2,
    },
  ],
  past: [],
  cancelled: [],
  delivery: {
    anchorWeekStart: '2026-09-07',
    weeks: [
      { week: 1, startsOn: '2026-09-07', sessions: [] },
      { week: 2, startsOn: '2026-09-14', sessions: [] },
    ],
  },
  generatedAt: '2026-09-02T15:00:00Z',
};

describe('DAEMON ARC — Teacher cohort live-session operations', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<SesionesCohorteDocente>;

  const crear = (): ComponentFixture<SesionesCohorteDocente> => {
    const creada = TestBed.createComponent(SesionesCohorteDocente);
    creada.detectChanges();
    return creada;
  };

  const responderCohortes = (cuerpo: CohortesResponse = COHORTES): void => {
    httpMock.expectOne((peticion) => peticion.url.includes('/academico/cohortes')).flush(cuerpo);
    fixture.detectChanges();
  };

  const responderSesiones = (cuerpo: SesionesCohorteResponse = SESIONES): void => {
    httpMock.expectOne((peticion) => peticion.url.includes('/aulas/7/sesiones')).flush(cuerpo);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SesionesCohorteDocente],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzI18n(es_ES),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows a skeleton while the cohort list is loading', () => {
    fixture = crear();

    expect(fixture.nativeElement.querySelector('nz-skeleton')).toBeTruthy();

    httpMock.expectOne((peticion) => peticion.url.includes('/academico/cohortes')).flush(COHORTES);
    fixture.detectChanges();
    responderSesiones();
  });

  it('renders the real cohort context and prioritises next session over upcoming ones', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('IA: Origen Teens — Cohorte piloto');
    expect(texto).toContain('IA: Origen');
    expect(texto).toContain('Cohorte 2026');
    expect(texto).toContain('14');
    expect(texto).toContain('Próxima sesión');
    expect(texto).toContain('Semana 1 — ¿La IA piensa?');

    const componente = fixture.componentInstance;
    expect(componente.proxima()?.id).toBe(91);
    expect(componente.siguientes().map((sesion) => sesion.id)).toEqual([92]);
  });

  it('shows an honest empty state when the cohort has no sessions yet', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones({
      ...SESIONES,
      nextSession: null,
      upcoming: [],
      past: [],
      cancelled: [],
      delivery: { anchorWeekStart: null, weeks: [] },
    });

    expect(fixture.nativeElement.querySelector('nz-empty')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('todavía no tiene sesiones');
  });

  it('shows an empty state when the teacher has no operable cohorts', () => {
    fixture = crear();
    responderCohortes({ cohorts: [], generatedAt: '2026-09-02T15:00:00Z' });

    expect(fixture.nativeElement.querySelector('nz-empty')).toBeTruthy();
    expect(fixture.componentInstance.cohorteSeleccionada()).toBeNull();
  });

  it('renders an authorization result when the backend denies the cohort', () => {
    fixture = crear();
    responderCohortes();
    httpMock
      .expectOne((peticion) => peticion.url.includes('/aulas/7/sesiones'))
      .flush({ message: 'No puedes operar sobre un aula fuera de tu alcance.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.tipo).toBe('autorizacion');
    expect(fixture.nativeElement.querySelector('nz-result')).toBeTruthy();
  });

  it('renders a retryable alert on a generic API error', () => {
    fixture = crear();
    responderCohortes();
    httpMock
      .expectOne((peticion) => peticion.url.includes('/aulas/7/sesiones'))
      .flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.tipo).toBe('api');
    expect(fixture.nativeElement.querySelector('nz-alert')).toBeTruthy();
  });

  it('rejects an invalid create form without issuing any request', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const componente = fixture.componentInstance;
    componente.abrirCreacion();
    componente.guardar();

    expect(componente.formulario.invalid).toBe(true);
    httpMock.expectNone((peticion) => peticion.method === 'POST');
  });

  it('rejects an end time that is not after the start time', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const componente = fixture.componentInstance;
    componente.abrirCreacion();
    componente.formulario.patchValue({
      titulo: 'Semana 1 — ¿La IA piensa?',
      inicio: new Date('2026-09-07T18:00:00Z'),
      fin: new Date('2026-09-07T17:00:00Z'),
    });
    componente.guardar();

    expect(componente.formulario.errors?.['ventana']).toBe(true);
    httpMock.expectNone((peticion) => peticion.method === 'POST');
  });

  it('rejects a non http(s) meeting url', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const componente = fixture.componentInstance;
    componente.abrirCreacion();
    componente.formulario.patchValue({
      titulo: 'Semana 1',
      inicio: new Date('2026-09-07T18:00:00Z'),
      accesoUrl: 'javascript:alert(1)',
    });

    expect(componente.formulario.controls.accesoUrl.invalid).toBe(true);
  });

  it('posts a valid session to the canonical create endpoint and reloads the list', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const componente = fixture.componentInstance;
    componente.abrirCreacion();
    componente.formulario.patchValue({
      titulo: '  Semana 1 — ¿La IA piensa?  ',
      inicio: new Date('2026-09-07T23:00:00Z'),
      fin: new Date('2026-09-08T00:30:00Z'),
      accesoUrl: 'https://meet.example.test/ia-origen-s1',
      descripcion: 'Nota interna.',
    });
    componente.guardar();

    const peticion = httpMock.expectOne(
      (candidata) => candidata.method === 'POST' && candidata.url.includes('/academico/aulas/7/sesiones'),
    );
    expect(peticion.request.body).toEqual({
      titulo: 'Semana 1 — ¿La IA piensa?',
      descripcion: 'Nota interna.',
      inicio_at: '2026-09-07T23:00:00.000Z',
      fin_at: '2026-09-08T00:30:00.000Z',
      acceso_url: 'https://meet.example.test/ia-origen-s1',
    });
    peticion.flush({ id: 91 }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(componente.drawerAbierto()).toBe(false);
    responderSesiones();
  });

  it('edits an existing session through the canonical PUT contract', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    const componente = fixture.componentInstance;
    componente.abrirEdicion(SESIONES.upcoming[0]);
    expect(componente.formulario.controls.titulo.value).toBe('Semana 1 — ¿La IA piensa?');

    componente.formulario.patchValue({
      inicio: new Date('2026-09-08T01:00:00Z'),
      fin: new Date('2026-09-08T02:30:00Z'),
    });
    componente.guardar();

    const peticion = httpMock.expectOne(
      (candidata) => candidata.method === 'PUT' && candidata.url.includes('/academico/sesiones/91'),
    );
    expect(peticion.request.body).toMatchObject({
      inicio_at: '2026-09-08T01:00:00.000Z',
      fin_at: '2026-09-08T02:30:00.000Z',
      estado: 'scheduled',
    });
    peticion.flush({ id: 91 });
    fixture.detectChanges();
    responderSesiones();
  });

  it('cancels a session with the canonical cancelled state, not a bespoke endpoint', () => {
    fixture = crear();
    responderCohortes();
    responderSesiones();

    fixture.componentInstance.cancelarSesion(SESIONES.upcoming[0]);

    const peticion = httpMock.expectOne(
      (candidata) => candidata.method === 'PUT' && candidata.url.includes('/academico/sesiones/91'),
    );
    expect(peticion.request.body).toMatchObject({ estado: 'cancelled' });
    peticion.flush({ id: 91, estado: 'cancelled' });
    fixture.detectChanges();
    responderSesiones();
  });
});
