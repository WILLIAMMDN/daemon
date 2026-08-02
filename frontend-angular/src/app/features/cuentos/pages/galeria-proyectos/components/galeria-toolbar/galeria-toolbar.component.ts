import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookOpen, faCircleUser, faCalendarDays, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

type FiltroCuento = 'todos' | 'mio';
type OrdenCuento = 'recientes' | 'antiguos' | 'titulo';

@Component({
  selector: 'app-galeria-toolbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './galeria-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'style': 'display: contents'
  }
})
export class GaleriaToolbarComponent {
  faBookOpen = faBookOpen;
  faCircleUser = faCircleUser;
  faCalendarDays = faCalendarDays;
  faMagnifyingGlass = faMagnifyingGlass;

  @Input() filtro: FiltroCuento = 'todos';
  @Input() orden: OrdenCuento = 'recientes';
  @Input() busqueda = '';

  @Output() onFiltroChange = new EventEmitter<FiltroCuento>();
  @Output() onOrdenChange = new EventEmitter<OrdenCuento>();
  @Output() onBusquedaChange = new EventEmitter<string>();

  actualizarBusqueda(event: Event): void {
    this.onBusquedaChange.emit((event.target as HTMLInputElement).value);
  }

  actualizarOrden(event: Event): void {
    this.onOrdenChange.emit((event.target as HTMLSelectElement).value as OrdenCuento);
  }
}
