import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Activos } from '../../../../core/servicios/activos';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { EstadoVacio } from '../../../../shared/componentes/estado-vacio/estado-vacio';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { Docente } from '../../services/docente';

@Component({
  selector: 'app-gestionar-insignias',
  imports: [
    FormsModule,
    NzAlertModule,
    NzAvatarModule,
    NzButtonModule,
    NzTagModule,
    Cargando,
    EstadoVacio,
    MediaUploader,
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

  constructor(private docente: Docente, private activos: Activos) {
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
        this.mensaje.set('Insignia creada.');
        this.guardando.set(false);
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

  asignar(): void {
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.docente.asignarInsignia(this.asignacion).subscribe({
      next: () => {
        this.mensaje.set('Asignacion actualizada.');
        this.guardando.set(false);
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
}
