import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estado-vacio',
  templateUrl: './estado-vacio.html',
  styleUrl: './estado-vacio.scss',
})
export class EstadoVacio {
  @Input() titulo = 'Sin información';
  @Input() descripcion = 'Todavía no hay registros para mostrar.';
  @Input() compacto = false;
}
