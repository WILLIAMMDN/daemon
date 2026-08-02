import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBookOpenReader, faHeart, faBookmark, faShareNodes, faClock, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { CuentoDetallePayload } from '../../../../models/cuento.models';
import { Activos } from '../../../../../../core/servicios/activos';
import { migrarContenidoLegacy } from '../../../../utils/cuento-legacy';

@Component({
  selector: 'app-cuento-lectura',
  standalone: true,
  imports: [CommonModule, QuillModule, FontAwesomeModule],
  templateUrl: './cuento-lectura.component.html',
  styleUrl: '../../../crear-cuento/crear-cuento.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CuentoLecturaComponent {
  private readonly activos = inject(Activos);

  faBookOpenReader = faBookOpenReader;
  faHeart = faHeart;
  faBookmark = faBookmark;
  faShareNodes = faShareNodes;
  faClock = faClock;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  @Input({ required: true }) set datosCuento(val: CuentoDetallePayload) {
    this._datosCuento = val;
    this.paginaActualIndex.set(0);
  }
  get datosCuento(): CuentoDetallePayload {
    return this._datosCuento;
  }
  private _datosCuento!: CuentoDetallePayload;
  @Input() modoLectura = false;
  @Input() escalaFuente = 1;
  @Input() guardado = false;
  @Input() miReaccion: string | null = null;

  @Output() onToggleModoLectura = new EventEmitter<void>();
  @Output() onCambiarFuente = new EventEmitter<number>();
  @Output() onReaccionar = new EventEmitter<string>();
  @Output() onGuardar = new EventEmitter<void>();
  @Output() onCompartir = new EventEmitter<void>();

  progresoPorcentaje = 0;
  paginaActualIndex = signal(0);

  /**
   * Resuelve la URL de la portada a través de `Activos`. Si la portada
   * es una URL completa (Supabase, base64, blob) la pasa tal cual;
   * si es una ruta relativa (`uploads/...`) la convierte a la URL
   * pública del bucket.
   */
  get portadaUrl(): string {
    return this.activos.url(this.datosCuento?.cuento?.portada);
  }

  @ViewChild('contenedorLectura') contenedorLectura!: ElementRef;

  get paginasCuento(): any[] {
    const p = this.datosCuento?.cuento?.paginas;
    if (Array.isArray(p) && p.length > 0) {
      return p;
    }
    // Fallback
    if (this.contenidoProcesado) {
      return [{
        id: 'legacy-1',
        contenido: this.contenidoProcesado,
        colorFondo: '#ffffff',
        ilustracion: null
      }];
    }
    return [];
  }

  get paginaActiva(): any {
    const paginas = this.paginasCuento;
    const index = this.paginaActualIndex();
    if (index >= 0 && index < paginas.length) {
      return paginas[index];
    }
    return paginas[0] || null;
  }

  siguientePagina() {
    if (this.paginaActualIndex() < this.paginasCuento.length - 1) {
      this.paginaActualIndex.update(i => i + 1);
      this.actualizarProgresoManual();
    }
  }

  anteriorPagina() {
    if (this.paginaActualIndex() > 0) {
      this.paginaActualIndex.update(i => i - 1);
      this.actualizarProgresoManual();
    }
  }

  irAPagina(index: number) {
    if (index >= 0 && index < this.paginasCuento.length) {
      this.paginaActualIndex.set(index);
      this.actualizarProgresoManual();
    }
  }

  private actualizarProgresoManual() {
    const total = this.paginasCuento.length;
    if (total <= 1) {
      this.progresoPorcentaje = 100;
      return;
    }
    const current = this.paginaActualIndex() + 1;
    this.progresoPorcentaje = Math.round((current / total) * 100);
  }

  resolverImagen(url: string | null | undefined): string {
    return this.activos.url(url);
  }

  /**
   * Procesa el contenido del cuento para mostrarlo. Detecta el formato
   * legacy (JSON con `bubbles` y `chars`) y lo convierte a HTML limpio,
   * descartando los sprites de personajes que ya no existen en el
   * sistema nuevo.
   */
  get contenidoProcesado(): string {
    const raw = this.datosCuento?.cuento?.contenido;
    if (!raw) return '';
    // El helper ya hace la limpieza: si es HTML normal lo devuelve tal
    // cual, si es JSON legacy extrae sólo los textos. Envolvemos en un
    // div con `word-break` para evitar overflow horizontal.
    const limpio = migrarContenidoLegacy(raw);
    if (!limpio) return '';
    if (limpio === raw) {
      return `<div style="word-break: break-word; overflow-wrap: break-word; max-width: 100%;">${raw}</div>`;
    }
    return `<div class="legacy-story" style="word-break: break-word; white-space: pre-wrap; max-width: 100%;">${limpio}</div>`;
  }

  @HostListener('window:scroll')
  onScroll() {
    // Scroll progress is no longer primary since we use pagination,
    // but we can keep it for edge cases.
  }
}
