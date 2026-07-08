import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faPen, faTrash, faPlus, faCheck, faRotate, faGift, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

export type TipoBotonAccion = 'crear' | 'editar' | 'eliminar' | 'detalles' | 'revisar' | 'entregar' | 'guardar' | 'actualizar' | 'agregar_usuario';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-boton-accion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, NzButtonModule, NzPopconfirmModule],
  templateUrl: './boton-accion.html'
})
export class BotonAccion {
  @Input() tipo: TipoBotonAccion = 'detalles';
  @Input() texto = '';
  @Input() cargando = false;
  @Input() deshabilitado = false;
  @Input() anchoCompleto = false;
  @Input() claseExtra = '';
  @Input() esSubmit = false;
  
  // Exclusivo para eliminar
  @Input() confirmacion = '¿Estás seguro de continuar con esta acción?';

  @Output() accion = new EventEmitter<void>();

  iconos = {
    crear: faPlus,
    editar: faPen,
    eliminar: faTrash,
    detalles: faMagnifyingGlass,
    guardar: faCheck,
    actualizar: faRotate,
    entregar: faGift,
    agregar_usuario: faUserPlus
  };

  ejecutar() {
    this.accion.emit();
  }
}
