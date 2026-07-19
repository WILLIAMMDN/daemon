import { UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowUpRightFromSquare, faCheck, faFileArrowUp, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Cargando } from '../../../../shared/componentes/cargando/cargando';
import { MediaUploader } from '../../../../shared/componentes/media-uploader/media-uploader';
import { DetalleMisionRespuesta, EntregaMision, Mision } from '../../services/mision';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-entregar-mision',
  imports: [
    FormsModule,
    RouterLink,
    FontAwesomeModule,
    NzAlertModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzCardModule,
    NzTagModule,
    Cargando,
    MediaUploader,
    UpperCasePipe,
  ],
  templateUrl: './entregar-mision.html',
  styleUrl: './entregar-mision.scss',
})
export class EntregarMision {
  readonly id: number;
  readonly detalle = signal<DetalleMisionRespuesta | null>(null);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly archivoNombre = signal('');
  readonly uploadResetKey = signal(0);
  readonly iconos = {
    actualizar: faRotateRight,
    archivo: faFileArrowUp,
    check: faCheck,
    externo: faArrowUpRightFromSquare,
    regresar: faArrowLeft,
  };

  texto = '';
  private archivo: File | null = null;

  constructor(private readonly route: ActivatedRoute, private readonly mision: Mision) {
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
      error: (problema: unknown) => {
        this.error.set(this.mensajeError(problema, 'No se pudo cargar la misión.'));
        this.cargando.set(false);
      },
    });
  }

  entregar(): void {
    if (!this.puedeEntregar()) return;

    this.enviando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const datos = new FormData();
    datos.append('texto', this.texto.trim());
    if (this.archivo) datos.append('archivo', this.archivo);

    this.mision.entregar(this.id, datos)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          this.mensaje.set('Entrega registrada. Tu trabajo quedó en revisión.');
          this.limpiar();
          this.cargar();
        },
        error: (problema: unknown) => {
          this.error.set(this.mensajeError(problema, 'No se pudo registrar la entrega. Tu evidencia permanece en esta pantalla.'));
        },
      });
  }

  seleccionarArchivo(archivo: File | null): void {
    this.archivo = archivo;
    this.archivoNombre.set(archivo?.name ?? '');
  }

  puedeEntregar(): boolean {
    return Boolean((this.texto.trim() || this.archivo) && !this.entregaBloqueada());
  }

  entregaBloqueada(): boolean {
    const estado = this.detalle()?.entrega?.estado;
    return estado === 'pendiente' || estado === 'aprobado';
  }

  estadoLabel(entrega: EntregaMision | null): string {
    if (!entrega) return 'Sin entrega';
    if (entrega.estado === 'aprobado') return 'Aprobada';
    if (entrega.estado === 'pendiente') return 'En revisión';
    return 'Requiere cambios';
  }

  limpiar(): void {
    this.texto = '';
    this.archivo = null;
    this.archivoNombre.set('');
    this.uploadResetKey.update((valor) => valor + 1);
  }

  private mensajeError(problema: unknown, fallback: string): string {
    if (problema instanceof HttpErrorResponse) return problema.error?.message ?? fallback;
    return fallback;
  }
}
