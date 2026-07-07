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

  it('should clear cache on POST', () => {
    // 1st request caches
    service.get('/cache-test').subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/cache-test`);
    req1.flush({ data: 'first' });

    // POST clears cache
    service.post('/some-action', {}).subscribe();
    const reqPost = httpMock.expectOne(`${environment.apiUrl}/some-action`);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({});

    // 2nd GET should trigger a new HTTP request
    service.get('/cache-test').subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}/cache-test`);
    req2.flush({ data: 'second' });
  });
});
