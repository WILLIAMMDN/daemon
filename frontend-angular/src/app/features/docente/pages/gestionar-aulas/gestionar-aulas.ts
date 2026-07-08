import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Docente } from '../../services/docente';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-aulas',
  imports: [FormsModule, NzAlertModule, NzButtonModule, NzTagModule, NzTableModule, NzPopconfirmModule, NzModalModule, Cargando, EstadoVacio, BotonAccion],
  templateUrl: './gestionar-aulas.html',
  styleUrl: './gestionar-aulas.scss',
})
export class GestionarAulas {
  aulas = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  
  modalVisible = signal(false);
  aulaEditando: any = null;

  nueva = {
    nombre: '',
    nivel: 'KIDS',
  };

  constructor(private docente: Docente, private message: NzMessageService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.docente.aulas().subscribe({
      next: (res: any) => {
        this.aulas.set(res.data || []);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las aulas.');
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.crearAula(this.nueva).subscribe({
      next: () => {
        this.mensaje.set('Aula creada exitosamente.');
        this.nueva = { nombre: '', nivel: 'KIDS' };
        this.guardando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear el aula.');
        this.guardando.set(false);
      },
    });
  }

  abrirEditar(a: any): void {
    this.aulaEditando = { ...a };
    this.modalVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalVisible.set(false);
    this.aulaEditando = null;
  }

  guardarEdicion(): void {
    if (!this.aulaEditando) return;
    this.guardando.set(true);
    this.docente.actualizarAula(this.aulaEditando.id, this.aulaEditando).subscribe({
      next: () => {
        this.message.success('Aula actualizada correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar el aula.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.docente.eliminarAula(id).subscribe({
      next: () => {
        this.message.success('Aula eliminada correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar el aula. Asegúrate de que no tenga estudiantes asignados.');
      }
    });
  }
}
