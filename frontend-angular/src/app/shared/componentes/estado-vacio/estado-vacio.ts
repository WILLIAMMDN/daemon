import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estado-vacio',
  imports: [NzEmptyModule],
  templateUrl: './estado-vacio.html',
  styleUrl: './estado-vacio.scss',
})
export class EstadoVacio {
  @Input() titulo = 'Sin informacion';
  @Input() descripcion = 'Todavia no hay registros para mostrar.';
}
