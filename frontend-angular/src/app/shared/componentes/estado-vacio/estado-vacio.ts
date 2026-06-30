import { Component, Input } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-estado-vacio',
  imports: [NzEmptyModule],
  templateUrl: './estado-vacio.html',
  styleUrl: './estado-vacio.scss',
})
export class EstadoVacio {
  @Input() titulo = 'Sin informacion';
  @Input() descripcion = 'Todavia no hay registros para mostrar.';
}
