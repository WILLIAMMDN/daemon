import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Evaluacion, ResultadoEvaluacion } from '../../services/evaluacion';
import { ResultadosExamen } from './resultados-examen';

const resultados: ResultadoEvaluacion[] = [
  { id: 1, alumno_id: 7, examen_id: 11, nivel: 'KIDS', respuestas: {}, puntaje: 60, fecha_envio: '2026-07-18T10:00:00Z', titulo: 'Lógica' },
  { id: 2, alumno_id: 7, examen_id: 12, nivel: 'KIDS', respuestas: {}, puntaje: 80, fecha_envio: '2026-07-19T10:00:00Z', titulo: 'Robótica' },
  { id: 3, alumno_id: 7, examen_id: 13, nivel: 'KIDS', respuestas: {}, puntaje: 100, fecha_envio: '2026-07-19T11:00:00Z', titulo: 'Creatividad' },
];

describe('ResultadosExamen', () => {
  const cargarResultados = jest.fn();

  beforeEach(async () => {
    cargarResultados.mockReset().mockReturnValue(of(resultados));
    await TestBed.configureTestingModule({
      imports: [ResultadosExamen],
      providers: [provideRouter([]), { provide: Evaluacion, useValue: { resultados: cargarResultados } }],
    }).compileComponents();
  });

  it('calcula el resumen desde resultados reales y aplica el umbral de 70 puntos', () => {
    const fixture = TestBed.createComponent(ResultadosExamen);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const summary = element.querySelector('.results-summary')?.textContent;

    expect(element.querySelector('main')).toBeNull();
    expect(summary).toContain('80 puntos');
    expect(summary).toContain('100 puntos');
    expect(summary).toContain('2 de 3');
    expect(element.querySelectorAll('.results-table-card tbody tr')).toHaveLength(3);
    expect(element.querySelector('.results-table-card tbody tr')?.textContent).toContain('Sigue practicando');
  });

  it('presenta el historial vacío sin inventar resultados', () => {
    cargarResultados.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(ResultadosExamen);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.results-empty')?.textContent).toContain('Todavía no tienes resultados');
    expect(element.querySelector('.results-table-card')).toBeNull();
  });

  it('diferencia un error de carga del historial vacío', () => {
    cargarResultados.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = TestBed.createComponent(ResultadosExamen);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.results-error')?.textContent).toContain('No pudimos abrir tu historial');
    expect(element.querySelector('.results-empty')).toBeNull();
  });
});
