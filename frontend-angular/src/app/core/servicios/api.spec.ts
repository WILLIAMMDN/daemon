import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Api } from './api';
import { environment } from '../../../environments/environment';

describe('Api Service', () => {
  let service: Api;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Api],
    });
    service = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should construct correct URL', () => {
    service.get('/test').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/test`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should cache GET requests', () => {
    // 1st request
    service.get('/cache-test').subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/cache-test`);
    req1.flush({ data: 'first' });

    // 2nd request (should use cache, so no new HTTP request is expected)
    let secondData: any;
    service.get('/cache-test').subscribe(data => secondData = data);
    
    // There should be no new requests
    httpMock.expectNone(`${environment.apiUrl}/cache-test`);
    expect(secondData).toEqual({ data: 'first' });
  });

  it('should deduplicate simultaneous GET requests', () => {
    const values: unknown[] = [];
    service.get('/shared').subscribe((value) => values.push(value));
    service.get('/shared').subscribe((value) => values.push(value));

    const requests = httpMock.match(`${environment.apiUrl}/shared`);
    expect(requests).toHaveLength(1);
    requests[0].flush({ data: 'shared' });
    expect(values).toEqual([{ data: 'shared' }, { data: 'shared' }]);
  });

  it('should return stale data immediately and refresh it in the background', () => {
    let now = 1_000;
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

    service.get('/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/panel`).flush({ version: 1 });

    now += 3 * 60 * 1000;
    const values: unknown[] = [];
    service.get('/panel').subscribe((value) => values.push(value));

    expect(values).toEqual([{ version: 1 }]);
    httpMock.expectOne(`${environment.apiUrl}/panel`).flush({ version: 2 });
    expect(values).toEqual([{ version: 1 }, { version: 2 }]);

    dateSpy.mockRestore();
  });

  it('should invalidate only the scope changed by a mutation', () => {
    service.get('/chatbot/bot').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/chatbot/bot`).flush({ nombre: 'Ada' });
    service.get('/alumno/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alumno/panel`).flush({ experiencia: 100 });

    service.post('/chatbot/mensajes', { content: 'Hola' }).subscribe();
    const reqPost = httpMock.expectOne(`${environment.apiUrl}/chatbot/mensajes`);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({});

    service.get('/chatbot/bot').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/chatbot/bot`).flush({ nombre: 'Ada' });

    service.get('/alumno/panel').subscribe();
    httpMock.expectNone(`${environment.apiUrl}/alumno/panel`);
  });

  it('should keep cached data when a mutation fails', () => {
    service.get('/chatbot/bot').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/chatbot/bot`).flush({ nombre: 'Ada' });

    service.post('/chatbot/mensajes', { content: 'Hola' }).subscribe({ error: () => undefined });
    httpMock.expectOne(`${environment.apiUrl}/chatbot/mensajes`).flush(
      { message: 'No disponible' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    service.get('/chatbot/bot').subscribe();
    httpMock.expectNone(`${environment.apiUrl}/chatbot/bot`);
  });

  it('should invalidate panel and ranking after an academic reward changes', () => {
    service.get('/alumno/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alumno/panel`).flush({ experiencia: 100 });
    service.get('/ranking').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/ranking`).flush({ alumnos: [] });

    service.post('/misiones/8/entregar', {}).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/misiones/8/entregar`).flush({});

    service.get('/alumno/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alumno/panel`).flush({ experiencia: 120 });
    service.get('/ranking').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/ranking`).flush({ alumnos: [] });
  });

  it('should clear every cached response when the authenticated session changes', () => {
    service.get('/alumno/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alumno/panel`).flush({ experiencia: 100 });

    service.post('/auth/login', {}).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ usuario: { id: 2 } });

    service.get('/alumno/panel').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/alumno/panel`).flush({ experiencia: 200 });
  });

  it('should bypass cache when fresh data is requested', () => {
    service.get('/fresh-test').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/fresh-test`).flush({ version: 1 });

    service.get('/fresh-test', { fresh: true }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/fresh-test`).flush({ version: 2 });
  });
});
