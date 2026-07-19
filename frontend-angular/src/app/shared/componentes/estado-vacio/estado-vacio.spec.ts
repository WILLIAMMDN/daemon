import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EstadoVacio } from './estado-vacio';

@Component({
  imports: [EstadoVacio, NzButtonModule],
  template: `
    <app-estado-vacio titulo="Sin cursos" descripcion="Tu docente todavía no asignó una ruta." tamano="compact">
      <button nz-button nzType="primary" type="button">Actualizar</button>
    </app-estado-vacio>
  `,
})
class HostEstadoVacio {}

describe('EstadoVacio', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [EstadoVacio, HostEstadoVacio],
  }));

  it('usa el robot canónico dentro de nz-empty y conserva el mensaje contextual', () => {
    const fixture = TestBed.createComponent(HostEstadoVacio);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector<HTMLImageElement>('.empty-state__art img');

    expect(element.querySelector('nz-empty')).not.toBeNull();
    expect(image?.getAttribute('src')).toBe('/img/empty/empty-robot.webp');
    expect(image?.getAttribute('alt')).toBe('');
    expect(element.querySelector('h3')?.textContent).toContain('Sin cursos');
    expect(element.querySelector('p')?.textContent).toContain('Tu docente todavía no asignó una ruta.');
    expect(element.querySelector('.empty-state')?.classList).toContain('empty-state--compact');
    expect(element.querySelector('.ant-btn-primary')?.textContent).toContain('Actualizar');
  });

  it('evita una imagen rota y presenta un fallback al fallar el asset', () => {
    const fixture = TestBed.createComponent(EstadoVacio);
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('.empty-state__art img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state__art img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.empty-state__fallback svg')).not.toBeNull();
  });
});
