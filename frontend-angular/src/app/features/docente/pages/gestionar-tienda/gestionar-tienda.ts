import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tienda } from '../../../tienda/services/tienda';
import { CommonModule } from '@angular/common';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { NzAlertModule } from 'ng-zorro-antd/alert';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { CATEGORIAS_PREMIO } from '../../../../core/dominio/nivel-alumno';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-tienda',
  imports: [FormsModule, CommonModule, Cargando, EstadoVacio, NzTableModule, NzPopconfirmModule, NzModalModule, NzTagModule, NzButtonModule, NzAlertModule, BotonAccion, MonedaDaemon],
  templateUrl: './gestionar-tienda.html',
  styleUrl: './gestionar-tienda.scss',
})
export class GestionarTienda {
  readonly categoriasPremio = CATEGORIAS_PREMIO;
  premios = signal<any[]>([]);
  canjes = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  modalCrearVisible = signal(false);
  modalEditVisible = signal(false);
  premioEditando: any = null;

  nuevo = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', categoria: 'GENERAL', tipo_entrega: 'fisico' };

  constructor(private tienda: Tienda, private message: NzMessageService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.tienda.administrar().subscribe({
      next: (datos: any) => {
        this.premios.set(datos.premios ?? []);
        this.canjes.set(datos.canjes ?? []);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la tienda.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.nuevo = { nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', categoria: 'GENERAL', tipo_entrega: 'fisico' };
    this.modalCrearVisible.set(true);
  }

  cerrarCrear(): void {
    this.modalCrearVisible.set(false);
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.tienda.crearPremio(this.nuevo).subscribe({
      next: () => {
        this.message.success('Premio creado exitosamente.');
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear el premio.');
        this.guardando.set(false);
      },
    });
  }

  entregar(id: number): void {
    this.guardando.set(true);
    this.tienda.entregarCanje(id).subscribe({
      next: () => {
        this.message.success('Canje marcado como entregado.');
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'No se pudo entregar el canje.');
        this.guardando.set(false);
      },
    });
  }

  abrirEditar(p: any): void {
    this.premioEditando = { ...p };
    this.modalEditVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalEditVisible.set(false);
    this.premioEditando = null;
  }

  guardarEdicion(): void {
    if (!this.premioEditando) return;
    this.guardando.set(true);
    this.tienda.actualizarPremio(this.premioEditando.id, this.premioEditando).subscribe({
      next: () => {
        this.message.success('Premio actualizado correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar el premio.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.tienda.eliminarPremio(id).subscribe({
      next: () => {
        this.message.success('Premio eliminado correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar el premio.');
      }
    });
  }
}
