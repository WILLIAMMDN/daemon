import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DetalleMisionRespuesta, Mision } from '../../services/mision';
import { EntregarMision } from './entregar-mision';

const base: DetalleMisionRespuesta = {
  mision: {
    id: 7,
    titulo: 'Construye una solución',
    recompensa: 35,
    tipo_evidencia: 'archivo',
    nivel_requerido: 'TEENS',
    estado: 'activo',
  },
  entrega: null,
};

describe('EntregarMision', () => {
  const detalle = jest.fn();
  const entregar = jest.fn();

  async function configurar(respuesta: DetalleMisionRespuesta): Promise<void> {
    detalle.mockReset().mockReturnValue(of(respuesta));
    entregar.mockReset().mockReturnValue(of({ id: 99, id_desafio: 7, id_alumno: 1, estado: 'pendiente' }));
    await TestBed.configureTestingModule({
      imports: [EntregarMision],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
        { provide: Mision, useValue: { detalle, entregar } },
      ],
    }).compileComponents();
  }

  it('bloquea el reenvío mientras la evidencia está pendiente', async () => {
    await configurar({
      ...base,
      entrega: { id: 8, id_desafio: 7, id_alumno: 1, estado: 'pendiente' },
    });
    const fixture = TestBed.createComponent(EntregarMision);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.delivery-locked-card')?.textContent).toContain('evidencia está en revisión');
    expect(fixture.componentInstance.entregaBloqueada()).toBe(true);
  });

  it('habilita una nueva versión sólo cuando el docente solicita cambios', async () => {
    await configurar({
      ...base,
      entrega: { id: 8, id_desafio: 7, id_alumno: 1, estado: 'rechazado', comentario_docente: 'Explica mejor el proceso.' },
    });
    const fixture = TestBed.createComponent(EntregarMision);
    fixture.detectChanges();
    fixture.componentInstance.texto = 'Esta es mi versión corregida.';
    fixture.componentInstance.entregar();

    expect(entregar).toHaveBeenCalledTimes(1);
    const datos = entregar.mock.calls[0][1] as FormData;
    expect(datos.get('texto')).toBe('Esta es mi versión corregida.');
  });
});
