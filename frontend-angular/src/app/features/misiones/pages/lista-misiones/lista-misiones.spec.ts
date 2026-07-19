import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Mision, MisionAlumno } from '../../services/mision';
import { ListaMisiones } from './lista-misiones';

const misiones: MisionAlumno[] = [
  { id: 1, titulo: 'Explora', recompensa: 20, tipo_evidencia: 'texto', nivel_requerido: 'KIDS', estado: 'activo' },
  { id: 2, titulo: 'En revisión', recompensa: 30, tipo_evidencia: 'archivo', nivel_requerido: 'TEENS', estado: 'activo', entrega: { id: 20, id_desafio: 2, id_alumno: 1, estado: 'pendiente' } },
  { id: 3, titulo: 'Completada', recompensa: 40, tipo_evidencia: 'imagen', nivel_requerido: 'TODOS', estado: 'activo', entrega: { id: 30, id_desafio: 3, id_alumno: 1, estado: 'aprobado' } },
  { id: 4, titulo: 'Corrige', recompensa: 50, tipo_evidencia: 'video', nivel_requerido: 'TEENS', estado: 'activo', entrega: { id: 40, id_desafio: 4, id_alumno: 1, estado: 'rechazado' } },
];

describe('ListaMisiones', () => {
  const listar = jest.fn();

  beforeEach(async () => {
    listar.mockReset().mockReturnValue(of(misiones));
    await TestBed.configureTestingModule({
      imports: [ListaMisiones],
      providers: [provideRouter([]), { provide: Mision, useValue: { listar } }],
    }).compileComponents();
  });

  it('presenta estados reales, iconos y el slot reemplazable del hero', () => {
    const fixture = TestBed.createComponent(ListaMisiones);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main')).toBeNull();
    expect(element.querySelectorAll('.mission-card')).toHaveLength(4);
    expect(element.querySelectorAll('.mission-filter')).toHaveLength(5);
    expect(element.querySelectorAll('.mission-filter fa-icon')).toHaveLength(5);
    expect(element.querySelector('[data-asset-name="missions-route-guide.webp"]')).not.toBeNull();
    expect(element.querySelector('.mission-card[data-state="rejected"]')?.textContent).toContain('Por corregir');
  });

  it('filtra sin perder la acción correcta para una entrega rechazada', () => {
    const fixture = TestBed.createComponent(ListaMisiones);
    fixture.detectChanges();
    fixture.componentInstance.seleccionarFiltro('rejected');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.mission-card')).toHaveLength(1);
    expect(element.querySelector('.mission-card h2')?.textContent).toContain('Corrige');
    expect(element.querySelector<HTMLAnchorElement>('.mission-primary-action')?.getAttribute('href'))
      .toBe('/alumno/misiones/4/entregar');
  });

  it('diferencia un error remoto del estado académico vacío', () => {
    listar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const fixture = TestBed.createComponent(ListaMisiones);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.missions-error')?.textContent).toContain('No pudimos abrir tu ruta');
    expect(element.querySelector('.missions-state')).toBeNull();
  });
});
