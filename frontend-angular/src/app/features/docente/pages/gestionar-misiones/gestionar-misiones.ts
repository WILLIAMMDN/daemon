import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Mision } from '../../../misiones/services/mision';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';
import { MonedaDaemon } from '../../../../shared/componentes/moneda-daemon/moneda-daemon';
import { NIVELES_CONTENIDO } from '../../../../core/dominio/nivel-alumno';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-misiones',
  imports: [CommonModule, FormsModule, NzAlertModule, NzButtonModule, NzTagModule, NzTableModule, NzPopconfirmModule, NzModalModule, Cargando, EstadoVacio, BotonAccion, MonedaDaemon],
  templateUrl: './gestionar-misiones.html',
  styleUrl: './gestionar-misiones.scss',
})
export class GestionarMisiones {
  readonly nivelesContenido = NIVELES_CONTENIDO;
  misiones = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  // Modales
  modalCrearVisible = signal(false);
  modalEditVisible = signal(false);
  misionEditando: any = null;

  nueva = {
    titulo: '',
    descripcion: '',
    recompensa: 0,
    tipo_evidencia: 'texto',
    nivel_requerido: 'TODOS',
    estado: 'activo',
    es_mision_nivel: false,
  };

  constructor(private mision: Mision, private message: NzMessageService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.listar().subscribe({
      next: (misiones) => {
        this.misiones.set(misiones as any[]);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las misiones.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.nueva = { titulo: '', descripcion: '', recompensa: 0, tipo_evidencia: 'texto', nivel_requerido: 'TODOS', estado: 'activo', es_mision_nivel: false };
    this.modalCrearVisible.set(true);
  }

  cerrarCrear(): void {
    this.modalCrearVisible.set(false);
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.mision.crear(this.nueva).subscribe({
      next: () => {
        this.message.success('Misión creada exitosamente.');
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'No se pudo crear la misión.');
        this.guardando.set(false);
      },
    });
  }

  abrirEditar(m: any): void {
    this.misionEditando = { ...m };
    this.modalEditVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalEditVisible.set(false);
    this.misionEditando = null;
  }

  guardarEdicion(): void {
    if (!this.misionEditando) return;
    this.guardando.set(true);
    this.mision.actualizar(this.misionEditando.id, this.misionEditando).subscribe({
      next: () => {
        this.message.success('Misión actualizada correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar la misión.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.mision.eliminar(id).subscribe({
      next: () => {
        this.message.success('Misión eliminada correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar la misión.');
      }
    });
  }
}
