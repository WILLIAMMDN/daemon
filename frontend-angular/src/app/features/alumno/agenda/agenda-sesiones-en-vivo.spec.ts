import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { AgendaResponse, SesionAprendizajeDto } from '../models/contexto-alumno.model';
import { AgendaService } from './services/agenda.service';
import { Sesiones } from './pages/sesiones/sesiones';

const sesion = (parcial: Partial<SesionAprendizajeDto> & Pick<SesionAprendizajeDto, 'id' | 'title' | 'startsAt'>): SesionAprendizajeDto => ({
  type: 'live_session',
  course: { id: 20, title: 'IA: Origen' },
  cohort: { id: 7, name: 'Cohorte piloto', code: 'COH-IAO-01' },
  endsAt: null,
  durationMinutes: null,
  status: 'scheduled',
  access: null,
  ...parcial,
});

describe('DAEMON ARC — Student Agenda live sessions', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<Sesiones>;

  const AHORA = new Date('2026-09-02T15:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AHORA);

    TestBed.configureTestingModule({
      imports: [Sesiones],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNzI18n(es_ES)],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(AgendaService).sesiones.set([]);
  });

  afterEach(() => {
    httpMock.verify();
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  const responder = (eventos: SesionAprendizajeDto[]): void => {
    const peticion = httpMock.expectOne((candidata) => candidata.url.includes('/alumno/agenda'));
    const cuerpo: AgendaResponse = {
      range: { start: '2026-09-01T00:00:00Z', end: '2026-10-31T23:59:59Z' },
      events: eventos,
    };
    peticion.flush(cuerpo);
    fixture.detectChanges();
  };

  it('renders the canonical session contract returned by /alumno/agenda', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    responder([
      sesion({
        id: 91,
        title: 'Semana 1 — ¿La IA piensa?',
        startsAt: '2026-09-07T23:00:00Z',
        endsAt: '2026-09-08T00:30:00Z',
        durationMinutes: 90,
        access: { joinUrl: 'https://meet.example.test/ia-origen-s1' },
      }),
    ]);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Próxima sesión');
    expect(texto).toContain('Semana 1 — ¿La IA piensa?');
    expect(texto).toContain('IA: Origen');

    const enlace = fixture.nativeElement.querySelector('a[href="https://meet.example.test/ia-origen-s1"]');
    expect(enlace).toBeTruthy();
  });

  it('never renders internal teacher notes: the contract carries no description field', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    const conNotaInterna = {
      ...sesion({ id: 91, title: 'Semana 1', startsAt: '2026-09-07T23:00:00Z' }),
      description: 'Nota interna del docente',
    } as SesionAprendizajeDto;

    responder([conNotaInterna]);

    expect(fixture.nativeElement.textContent).not.toContain('Nota interna del docente');
  });

  it('separates the next session, later ones and past ones by real dates', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    responder([
      sesion({ id: 90, title: 'Ya ocurrió', startsAt: '2026-09-01T23:00:00Z', endsAt: '2026-09-02T00:30:00Z' }),
      sesion({ id: 91, title: 'La siguiente', startsAt: '2026-09-07T23:00:00Z' }),
      sesion({ id: 92, title: 'Más adelante', startsAt: '2026-09-14T23:00:00Z' }),
    ]);

    const servicio = TestBed.inject(AgendaService);
    expect(servicio.proximaSesion()?.id).toBe(91);
    expect(servicio.sesionesFuturas().map((item) => item.id)).toEqual([91, 92]);
    expect(servicio.sesionesPasadas().map((item) => item.id)).toEqual([90]);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Próximas sesiones');
    expect(texto).toContain('Sesiones pasadas');
  });

  it('keeps a cancelled session out of the next-session slot', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    responder([
      sesion({ id: 91, title: 'Cancelada', startsAt: '2026-09-07T23:00:00Z', status: 'cancelled' }),
      sesion({ id: 92, title: 'Vigente', startsAt: '2026-09-14T23:00:00Z' }),
    ]);

    expect(TestBed.inject(AgendaService).proximaSesion()?.id).toBe(92);
    expect(fixture.nativeElement.textContent).toContain('Cancelada');
  });

  it('shows an honest empty state when the cohort has no sessions', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    responder([]);

    expect(fixture.nativeElement.querySelector('app-estado-vacio')).toBeTruthy();
  });

  it('surfaces a retryable alert when the agenda request fails', () => {
    fixture = TestBed.createComponent(Sesiones);
    fixture.detectChanges();

    httpMock
      .expectOne((candidata) => candidata.url.includes('/alumno/agenda'))
      .flush({ message: 'Boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nz-alert')).toBeTruthy();
    expect(TestBed.inject(AgendaService).error()).toBeTruthy();
  });
});
