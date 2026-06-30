import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { Mision } from '../../services/mision';

@Component({
  selector: 'app-entregar-mision',
  imports: [
    FormsModule,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    Cargando,
    MediaUploader,
  ],
  templateUrl: './entregar-mision.html',
  styleUrl: './entregar-mision.scss',
})
export class EntregarMision {
  id: number;
  detalle = signal<any | null>(null);
  cargando = signal(true);
  enviando = signal(false);
  mensaje = signal('');
  error = signal('');
  archivoNombre = signal('');
  uploadResetKey = signal(0);
  texto = '';
  private archivo: File | null = null;

  constructor(private route: ActivatedRoute, private mision: Mision) {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.mision.detalle(this.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo cargar la mision.');
        this.cargando.set(false);
      },
    });
  }

  entregar(): void {
    this.enviando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const datos = new FormData();
    datos.append('texto', this.texto.trim());
    if (this.archivo) {
      datos.append('archivo', this.archivo);
    }

    this.mision.entregar(this.id, datos).subscribe({
      next: () => {
        this.mensaje.set('Entrega registrada.');
        this.limpiar();
        this.enviando.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'No se pudo registrar la entrega.');
        this.enviando.set(false);
      },
    });
  }

  seleccionarArchivo(archivo: File | null): void {
    this.archivo = archivo;
    this.archivoNombre.set(archivo?.name ?? '');
  }

  puedeEntregar(): boolean {
    return Boolean(this.texto.trim() || this.archivo);
  }

  limpiar(): void {
    this.texto = '';
    this.archivo = null;
    this.archivoNombre.set('');
    this.uploadResetKey.update((valor) => valor + 1);
  }
}
