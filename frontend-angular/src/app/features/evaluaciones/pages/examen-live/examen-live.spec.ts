import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Evaluacion, EvaluacionActiva } from '../../services/evaluacion';
import { ExamenLive } from './examen-live';

const examen: EvaluacionActiva = {
  id: 8,
  titulo: 'Pensamiento computacional',
  nivel: 'KIDS',
  estado: 'activo',
  preguntas: [
    { id: 81, examen_id: 8, enunciado: '¿Qué paso va primero?', tipo: 'opcion', opciones: ['Observar', 'Adivinar'] },
    { id: 82, examen_id: 8, enunciado: 'Explica tu decisión', tipo: 'texto', opciones: null },
  ],
};

describe('ExamenLive', () => {
  const activas = jest.fn();
  const responder = jest.fn();

  beforeEach(async () => {
    activas.mockReset().mockReturnValue(of([examen]));
    responder.mockReset().mockReturnValue(of({ resultado: {}, correctas: 2, total: 2 }));

    await TestBed.configureTestingModule({
      imports: [ExamenLive],
      providers: [provideRouter([]), { provide: Evaluacion, useValue: { activas, responder } }],
    }).compileComponents();
  });

  it('presenta preguntas accesibles y bloquea el envío incompleto', () => {
    const fixture = TestBed.createComponent(ExamenLive);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const enviar = element.querySelector<HTMLButtonElement>('button[type="submit"]');

    expect(element.querySelector('main')).toBeNull();
    expect(element.querySelectorAll('fieldset.question-card')).toHaveLength(2);
    expect(element.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
    expect(enviar?.disabled).toBe(true);

    fixture.componentInstance.actualizarRespuesta(examen.preguntas[0], 'Observar');
    fixture.componentInstance.actualizarRespuesta(examen.preguntas[1], 'Porque permite entender el problema');
    fixture.componentRef.changeDetectorRef.detectChanges();

    expect(fixture.componentInstance.respondidas(examen)).toBe(2);
    expect(fixture.componentInstance.puedeResponder(examen)).toBe(true);
  });

  it('envía únicamente el contrato de respuestas esperado por la API', () => {
    const fixture = TestBed.createComponent(ExamenLive);
    fixture.detectChanges();
    fixture.componentInstance.actualizarRespuesta(examen.preguntas[0], 'Observar');
    fixture.componentInstance.actualizarRespuesta(examen.preguntas[1], '  Porque reduce errores  ');
    fixture.componentInstance.responder(examen);
    fixture.detectChanges();

    expect(responder).toHaveBeenCalledWith(8, {
      '81': 'Observar',
      '82': 'Porque reduce errores',
    });
    expect((fixture.nativeElement as HTMLElement).querySelector('.assessment-feedback')?.textContent)
      .toContain('2 de 2 respuestas correctas');
  });

  it('diferencia un fallo remoto del estado sin evaluaciones', () => {
    activas.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = TestBed.createComponent(ExamenLive);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.assessments-error')?.textContent).toContain('No pudimos abrir tus evaluaciones');
    expect(element.querySelector('.assessments-empty')).toBeNull();
  });
});
