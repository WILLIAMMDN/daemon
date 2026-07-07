import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';

/**
 * Moneda oficial de la academia DAEMON.
 *
 * Componente reutilizable para representar la moneda de la plataforma
 * (tokens / créditos) en cualquier módulo que la necesite: sidebar,
 * tienda, ranking, perfil, panel de docente, etc.
 *
 * Tres formas de uso:
 *   1) Solo el icono:
 *      <app-moneda-daemon [size]="20" />
 *
 *   2) Icono + cantidad (modo compacto, número al lado):
 *      <app-moneda-daemon [size]="18" [cantidad]="1250" />
 *
 *   3) Icono + cantidad + etiqueta (modo apilado, útil en cards):
 *      <app-moneda-daemon [size]="42" [cantidad]="1250" apilad
 *                          etiqueta="Tokens disponibles" />
 *
 * El icono se sirve desde `/moneda/moneda-daemon.svg` (alojado en `public/moneda/`).
 * Si el navegador no carga el SVG (fallo de red, etc.) se muestra un fallback
 * circular con la letra "D" para que nunca quede un cuadro vacío.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-moneda-daemon',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './moneda-daemon.html',
  styleUrl: './moneda-daemon.scss',
})
export class MonedaDaemon {
  /** Tamaño del icono (ancho y alto) en píxeles. */
  @Input() size: number = 24;

  /** Cantidad a mostrar al lado del icono. Si es null/undefined se muestra solo el icono. */
  @Input() cantidad: number | null | undefined = null;

  /** Etiqueta opcional bajo el icono+valor (modo apilado). */
  @Input() etiqueta: string | null = null;

  /** Texto alternativo para accesibilidad (tooltip / aria-label). */
  @Input() titulo: string | null = null;

  /**
   * Modo de layout:
   *  - 'horizontal': icono y número en la misma línea (default).
   *  - 'apilado': icono grande arriba, número y etiqueta debajo.
   */
  @Input() layout: 'horizontal' | 'apilado' = 'horizontal';

  /** Variante visual de énfasis. */
  @Input() variante: 'suave' | 'fuerte' = 'suave';

  /** Cuando true, oculta el icono y solo muestra el número con prefijo textual. */
  @Input() soloNumero: boolean = false;

  /** Si el icono SVG falla al cargar, se activa este flag para mostrar el fallback. */
  imagenOk = true;

  get rutaSvg(): string {
    return '/moneda/moneda-daemon.svg';
  }

  get estilosIcono(): { [k: string]: string } {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
    };
  }

  /**
   * Tamaño de tipografía del número en función del tamaño del icono.
   * Mantiene una proporción coherente sin importar el `size`.
   */
  get tamanoTexto(): string {
    const s = this.size;
    if (s <= 18) return '0.78rem';
    if (s <= 24) return '0.88rem';
    if (s <= 32) return '1rem';
    if (s <= 48) return '1.15rem';
    return '1.35rem';
  }

  get claseLayout(): string {
    return `moneda moneda--${this.layout} moneda--${this.variante}`;
  }

  onImagenError(): void {
    this.imagenOk = false;
  }

  get tieneCantidad(): boolean {
    return this.cantidad !== null && this.cantidad !== undefined;
  }

  get tituloAccesible(): string {
    if (this.titulo) return this.titulo;
    if (this.etiqueta) return `${this.etiqueta}: ${this.cantidad ?? 0}`;
    if (this.tieneCantidad) return `${this.cantidad} tokens DAEMON`;
    return 'Moneda DAEMON';
  }

  /**
   * Tamaño de fuente del fallback "D" cuando el SVG no carga.
   * Proporcional al `size` del icono, mínimo 10px.
   */
  get tamanoFallback(): number {
    return Math.max(10, Math.round(this.size * 0.45));
  }
}