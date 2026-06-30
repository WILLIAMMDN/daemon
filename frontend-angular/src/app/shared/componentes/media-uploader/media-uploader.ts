import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadFile, NzUploadListType, NzUploadModule, NzUploadType } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-media-uploader',
  imports: [NzAlertModule, NzButtonModule, NzUploadModule],
  templateUrl: './media-uploader.html',
  styleUrl: './media-uploader.scss',
})
export class MediaUploader implements OnChanges {
  @Input() titulo = 'Subir archivo';
  @Input() descripcion = 'Arrastra un archivo o selecciona desde tu equipo.';
  @Input() textoBoton = 'Seleccionar archivo';
  @Input() accept = '';
  @Input() maxMb = 10;
  @Input() disabled = false;
  @Input() tipo: NzUploadType = 'drag';
  @Input() lista: NzUploadListType = 'text';
  @Input() resetKey: unknown = 0;

  @Output() archivoChange = new EventEmitter<File | null>();

  archivos: NzUploadFile[] = [];
  error = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey'] && !changes['resetKey'].firstChange) {
      this.error = '';
      this.archivos = [];
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const archivo = this.extraerArchivo(file);

    if (!archivo) {
      this.error = 'No pudimos leer el archivo seleccionado.';
      this.archivoChange.emit(null);
      this.archivos = [];
      return false;
    }

    const maxBytes = this.maxMb * 1024 * 1024;
    if (archivo.size > maxBytes) {
      this.error = `El archivo supera el limite de ${this.maxMb} MB.`;
      this.archivoChange.emit(null);
      this.archivos = [];
      return false;
    }

    this.error = '';
    this.archivos = [{
      ...file,
      name: archivo.name,
      size: archivo.size,
      status: 'done',
      originFileObj: archivo,
    }];
    this.archivoChange.emit(archivo);

    return false;
  };

  removeFile = (_file: NzUploadFile): boolean => {
    this.error = '';
    this.archivos = [];
    this.archivoChange.emit(null);
    return true;
  };

  private extraerArchivo(file: NzUploadFile): File | null {
    const origen = file.originFileObj;
    if (origen instanceof File) {
      return origen;
    }

    const posibleArchivo = file as unknown;
    return posibleArchivo instanceof File ? posibleArchivo : null;
  }
}
