import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Experiencia } from './pages/experiencia/experiencia';
import { Aprendizaje } from '../services/aprendizaje';
import { Actividades } from '../services/actividades';
import { ArtefactoAprendizajeDto, LearningMapResponse } from '../models/contexto-alumno.model';
import { AprendizajeResponse } from '../models/aprendizaje.model';

describe('DAEMON ARC — Evidence & Artifact System V1 (Frontend)', () => {
  let httpMock: HttpTestingController;
  let aprendizajeService: Aprendizaje;

  const mockAprendizajeResponse: AprendizajeResponse = {
    cursos: [
      {
        id: 20,
        titulo: 'IA: Origen',
        descripcion: 'Curso de prueba',
        nivel: 'TEENS',
        unidades: [],
      },
    ],
    resumen: {
      cursos: 1,
      lecciones: 1,
      completadas: 0,
      porcentaje: 0,
    },
  };

  const mockArtifactImage: ArtefactoAprendizajeDto = {
    id: 101,
    uuid: 'uuid-art-img-101',
    category: 'image',
    originalName: 'captura_laboratorio.png',
    mimeType: 'image/png',
    sizeBytes: 154200,
    downloadUrl: '/api/v1/academico/artefactos/101/contenido',
    externalUrl: null,
    checksumSha256: 'sha256-mock-hash-image',
    registeredAt: '2026-09-03T01:00:00Z',
  };

  const mockArtifactLink: ArtefactoAprendizajeDto = {
    id: 102,
    uuid: 'uuid-art-link-102',
    category: 'external_link',
    originalName: 'Notebook de Google Colab',
    mimeType: null,
    sizeBytes: null,
    downloadUrl: null,
    externalUrl: 'https://colab.research.google.com/drive/xyz',
    checksumSha256: null,
    registeredAt: '2026-09-03T01:05:00Z',
  };

  const mockLearningMapWithArtifacts: LearningMapResponse = {
    path: {
      id: 50,
      title: 'Ruta Troncal Teens',
      description: 'Secuencia principal',
      audience: 'TEENS',
      difficulty: 'intermedia',
      state: 'inProgress',
    },
    milestones: [
      {
        id: 1,
        title: 'Desmitificando a la máquina',
        order: 1,
        state: 'inProgress',
        experiences: [
          {
            id: 201,
            type: 'lab',
            title: 'Laboratorio: Clasificador de imágenes',
            order: 1,
            required: true,
            state: 'unlocked',
            attemptable: true,
            attemptLifecycle: {
              state: 'inProgress',
              action: 'start',
              canStartAttempt: true,
              canRevise: false,
              revisionExplanationRequired: false,
              activeAttemptId: 77,
              activeAttemptNumber: 1,
            },
            attempts: [
              {
                id: 77,
                number: 1,
                state: 'started',
                startedAt: '2026-09-03T01:00:00Z',
                evidence: [],
                artifacts: [],
                feedback: [],
              },
            ],
            objectives: [],
          },
        ],
      },
    ],
  };

  const flushExperienciaInit = () => {
    httpMock.expectOne((r) => r.url.includes('/alumno/aprendizaje')).flush(mockAprendizajeResponse);
    httpMock.expectOne((r) => r.url.includes('/alumno/learning-context')).flush({ currentEnrollment: null, activeEnrollments: [] });
    httpMock.expectOne((r) => r.url.includes('/alumno/home-context')).flush({ nextLiveSession: null });
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMapWithArtifacts);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        Aprendizaje,
        {
          provide: Actividades,
          useValue: {
            listar: () => of({ actividades: [] }),
            resumenSemanal: () => of({ horas_esta_semana: 0, meta_horas: 10 }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ cursoId: '20', experienceId: '201' }) },
            paramMap: of(convertToParamMap({ cursoId: '20', experienceId: '201' })),
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    aprendizajeService = TestBed.inject(Aprendizaje);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('Aprendizaje service correctly executes subirArtefacto, adjuntarEnlace, and eliminarArtefacto', () => {
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });

    // 1. subirArtefacto
    aprendizajeService.subirArtefacto(77, file).subscribe((art) => {
      expect(art.id).toBe(101);
      expect(art.category).toBe('image');
      expect(art.originalName).toBe('captura_laboratorio.png');
    });

    const reqSubir = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos'));
    expect(reqSubir.request.method).toBe('POST');
    expect(reqSubir.request.body instanceof FormData).toBe(true);
    reqSubir.flush(mockArtifactImage);

    // 2. adjuntarEnlace
    aprendizajeService.adjuntarEnlace(77, 'https://colab.research.google.com/drive/xyz', 'Notebook de Google Colab')
      .subscribe((art) => {
        expect(art.id).toBe(102);
        expect(art.category).toBe('external_link');
      });

    const reqEnlace = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos'));
    expect(reqEnlace.request.method).toBe('POST');
    expect(reqEnlace.request.body).toEqual({
      url_externa: 'https://colab.research.google.com/drive/xyz',
      nombre: 'Notebook de Google Colab',
    });
    reqEnlace.flush(mockArtifactLink);

    // 3. eliminarArtefacto
    aprendizajeService.eliminarArtefacto(77, 101).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const reqEliminar = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos/101'));
    expect(reqEliminar.request.method).toBe('DELETE');
    reqEliminar.flush({ ok: true });
  });

  it('Experiencia component validates file extension and max size before upload', () => {
    const fixture = TestBed.createComponent(Experiencia);
    const comp = fixture.componentInstance;

    flushExperienciaInit();

    // Intentar subir archivo ejecutable (.exe)
    const fileExe = new File(['malicious binary'], 'exploit.exe', { type: 'application/x-msdownload' });
    const fakeEventExe = { target: { files: [fileExe], value: 'exploit.exe' } } as unknown as Event;

    comp.onArchivoSeleccionado(fakeEventExe);
    expect(comp.errorArtefacto()).toContain('Formato de archivo no admitido');
    expect(comp.artefactosBorrador().length).toBe(0);

    // Intentar subir archivo que excede 10MB
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'muy_pesado.pdf', { type: 'application/pdf' });
    const fakeEventBig = { target: { files: [bigFile], value: 'muy_pesado.pdf' } } as unknown as Event;

    comp.onArchivoSeleccionado(fakeEventBig);
    expect(comp.errorArtefacto()).toContain('supera el tamaño máximo permitido de 10 MB');
    expect(comp.artefactosBorrador().length).toBe(0);
  });

  it('Experiencia component uploads valid file, adds external link, and includes artefacto_ids on evidence submission', () => {
    const fixture = TestBed.createComponent(Experiencia);
    const comp = fixture.componentInstance;

    flushExperienciaInit();

    // 1. Subir archivo PNG válido
    const validPng = new File(['valid png bytes'], 'captura_laboratorio.png', { type: 'image/png' });
    const eventValid = { target: { files: [validPng], value: 'captura_laboratorio.png' } } as unknown as Event;

    comp.onArchivoSeleccionado(eventValid);
    expect(comp.subiendoArchivo()).toBe(true);

    const reqUpload = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos'));
    reqUpload.flush(mockArtifactImage);
    expect(comp.subiendoArchivo()).toBe(false);
    expect(comp.artefactosBorrador().length).toBe(1);
    expect(comp.artefactosBorrador()[0].id).toBe(101);

    // 2. Adjuntar enlace externo
    comp.abrirModalEnlace();
    expect(comp.modalEnlaceVisible()).toBe(true);

    comp.enlaceUrl.set('https://colab.research.google.com/drive/xyz');
    comp.enlaceTitulo.set('Notebook de Google Colab');
    comp.guardarEnlace();

    const reqLink = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos'));
    reqLink.flush(mockArtifactLink);
    expect(comp.modalEnlaceVisible()).toBe(false);
    expect(comp.artefactosBorrador().length).toBe(2);

    // 3. Entregar evidencia asociando ambos artefactos
    comp.evidenciaTexto.set('Reporte final del experimento con clasificador');
    expect(comp.puedeEnviarEvidencia()).toBe(true);

    comp.entregarEvidencia();

    const reqEntrega = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/evidencias'));
    expect(reqEntrega.request.method).toBe('POST');
    expect(reqEntrega.request.body.artefacto_ids).toEqual([101, 102]);
    expect(reqEntrega.request.body.referencia).toBe('Reporte final del experimento con clasificador');

    reqEntrega.flush({ id: 999, estado: 'submitted', evidencias: [] });

    // Recarga el mapa tras entrega
    httpMock.expectOne((r) => r.url.includes('/alumno/aprender/mapa')).flush(mockLearningMapWithArtifacts);

    // El borrador se limpió tras enviar con éxito
    expect(comp.artefactosBorrador().length).toBe(0);
    expect(comp.feedback()).toContain('Tu evidencia fue enviada correctamente');
  });

  it('Experiencia component correctly removes draft artifact before submission', () => {
    const fixture = TestBed.createComponent(Experiencia);
    const comp = fixture.componentInstance;

    flushExperienciaInit();

    comp.artefactosBorrador.set([mockArtifactImage, mockArtifactLink]);
    expect(comp.artefactosBorrador().length).toBe(2);

    comp.quitarArtefacto(mockArtifactImage);

    const reqDelete = httpMock.expectOne((r) => r.url.includes('/alumno/aprender/intentos/77/artefactos/101'));
    expect(reqDelete.request.method).toBe('DELETE');
    reqDelete.flush({ ok: true });

    expect(comp.artefactosBorrador().length).toBe(1);
    expect(comp.artefactosBorrador()[0].id).toBe(102);
  });
});
