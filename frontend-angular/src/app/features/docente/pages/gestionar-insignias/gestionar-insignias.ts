import { Component, signal , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Activos } from '../../../../core/servicios/activos';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { Docente } from '../../services/docente';
import { BotonAccion } from '../../../../shared/componentes/boton-accion/boton-accion';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gestionar-insignias',
  imports: [
    FormsModule,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzTagModule,
    NzModalModule,
    NzPopconfirmModule,
    Cargando,
    EstadoVacio,
    MediaUploader,
    BotonAccion,
  ],
  templateUrl: './gestionar-insignias.html',
  styleUrl: './gestionar-insignias.scss',
})
export class GestionarInsignias {
  insignias = signal<any[]>([]);
  alumnos = signal<any[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');
  imagenPreview = signal('');
  uploadResetKey = signal(0);
  nueva = { nombre: '', descripcion: '', imagen: '' };
  asignacion = { id_alumno: null as number | null, id_insignia: null as number | null, asignar: true };
  private archivoImagen: File | null = null;

  modalCrearVisible = signal(false);
  modalAsignarVisible = signal(false);
  modalEditVisible = signal(false);
  
  insigniaEditando: any = null;
  imagenEditPreview = signal('');
  archivoEditImagen: File | null = null;
  uploadEditResetKey = signal(0);

  constructor(private docente: Docente, private activos: Activos, private message: NzMessageService) {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.docente.insignias().subscribe({
      next: (respuesta: any) => {
        if (Array.isArray(respuesta)) {
          this.insignias.set(respuesta);
        } else if (respuesta && Array.isArray(respuesta.data)) {
          this.insignias.set(respuesta.data);
        } else if (respuesta && Array.isArray(respuesta.insignias)) {
          this.insignias.set(respuesta.insignias);
        } else {
          this.insignias.set([]);
        }

        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudieron cargar las insignias.');
        this.insignias.set([]);
        this.cargando.set(false);
      },
    });

    this.docente.alumnos().subscribe({
      next: (respuesta: any) => {
        if (Array.isArray(respuesta)) {
          this.alumnos.set(respuesta);
        } else if (respuesta && Array.isArray(respuesta.data)) {
          this.alumnos.set(respuesta.data);
        } else if (respuesta && Array.isArray(respuesta.alumnos)) {
          this.alumnos.set(respuesta.alumnos);
        } else {
          this.alumnos.set([]);
        }
      },
      error: () => this.alumnos.set([]),
    });
  }

  seleccionarImagen(archivo: File | null): void {
    this.archivoImagen = archivo;

    if (!archivo) {
      this.imagenPreview.set('');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => this.imagenPreview.set(String(lector.result ?? ''));
    lector.readAsDataURL(archivo);
  }

  abrirCrear(): void {
    this.nueva = { nombre: '', descripcion: '', imagen: '' };
    this.archivoImagen = null;
    this.imagenPreview.set('');
    this.uploadResetKey.update((v) => v + 1);
    this.modalCrearVisible.set(true);
  }

  cerrarCrear(): void {
    this.modalCrearVisible.set(false);
  }

  crear(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const datos = new FormData();
    datos.append('nombre', this.nueva.nombre);
    datos.append('descripcion', this.nueva.descripcion ?? '');

    if (this.archivoImagen) {
      datos.append('archivo', this.archivoImagen);
    } else if (this.nueva.imagen.trim()) {
      datos.append('imagen', this.nueva.imagen.trim());
    }

    this.docente.crearInsignia(datos).subscribe({
      next: () => {
        this.nueva = { nombre: '', descripcion: '', imagen: '' };
        this.archivoImagen = null;
        this.imagenPreview.set('');
        this.uploadResetKey.update((valor) => valor + 1);
        this.message.success('Insignia creada exitosamente.');
        this.guardando.set(false);
        this.cerrarCrear();
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la insignia.');
        this.guardando.set(false);
      },
    });
  }

  puedeCrear(): boolean {
    return Boolean(this.nueva.nombre.trim() && (this.archivoImagen || this.nueva.imagen.trim()));
  }

  abrirAsignar(): void {
    this.asignacion = { id_alumno: null, id_insignia: null, asignar: true };
    this.modalAsignarVisible.set(true);
  }

  cerrarAsignar(): void {
    this.modalAsignarVisible.set(false);
  }

  asignar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.asignarInsignia(this.asignacion).subscribe({
      next: () => {
        this.message.success('Insignia asignada correctamente.');
        this.guardando.set(false);
        this.cerrarAsignar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo asignar la insignia.');
        this.guardando.set(false);
      },
    });
  }

  imagenNuevaVisible(): string {
    return this.imagenPreview() || this.activos.url(this.nueva.imagen);
  }

  imagenInsignia(ruta?: string | null): string {
    return this.activos.url(ruta);
  }

  abrirEditar(insignia: any): void {
    this.insigniaEditando = { ...insignia };
    this.imagenEditPreview.set('');
    this.archivoEditImagen = null;
    this.uploadEditResetKey.update((v) => v + 1);
    this.modalEditVisible.set(true);
  }

  cerrarEditar(): void {
    this.modalEditVisible.set(false);
    this.insigniaEditando = null;
  }

  seleccionarImagenEdit(archivo: File | null): void {
    this.archivoEditImagen = archivo;
    if (!archivo) {
      this.imagenEditPreview.set('');
      return;
    }
    const lector = new FileReader();
    lector.onload = () => this.imagenEditPreview.set(String(lector.result ?? ''));
    lector.readAsDataURL(archivo);
  }

  imagenEditVisible(): string {
    return this.imagenEditPreview() || this.activos.url(this.insigniaEditando?.imagen);
  }

  guardarEdicion(): void {
    if (!this.insigniaEditando) return;
    this.guardando.set(true);
    
    const datos = new FormData();
    datos.append('nombre', this.insigniaEditando.nombre);
    datos.append('descripcion', this.insigniaEditando.descripcion ?? '');

    if (this.archivoEditImagen) {
      datos.append('archivo', this.archivoEditImagen);
    } else if (this.insigniaEditando.imagen && this.insigniaEditando.imagen.trim()) {
      datos.append('imagen', this.insigniaEditando.imagen.trim());
    }

    this.docente.actualizarInsignia(this.insigniaEditando.id, datos).subscribe({
      next: () => {
        this.message.success('Insignia actualizada correctamente.');
        this.guardando.set(false);
        this.cerrarEditar();
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al actualizar la insignia.');
        this.guardando.set(false);
      }
    });
  }

  eliminar(id: number): void {
    this.docente.eliminarInsignia(id).subscribe({
      next: () => {
        this.message.success('Insignia eliminada correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.message.error(e.error?.message ?? 'Error al eliminar la insignia.');
      }
    });
  }
}
