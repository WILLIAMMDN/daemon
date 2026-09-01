import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ArcNavItem {
  etiqueta: string;
  ruta: string;
  /** Marca activo sólo con coincidencia exacta (útil en la ruta índice del área). */
  exacto?: boolean;
  /** Contador real; se omite cuando no hay dato que mostrar. */
  contador?: number | null;
}

/**
 * Navegación local de un área del estudiante.
 *
 * Es un `<nav>` de enlaces reales (deep-linkable, operable con teclado, con
 * foco visible). No usa `nz-tabs` porque las pestañas de NG-ZORRO renderizan
 * `div`s con `role="tab"` y aquí cada destino es una ruta navegable.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-arc-local-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './arc-local-nav.html',
  styleUrl: './arc-local-nav.scss',
})
export class ArcLocalNav {
  readonly items = input.required<ArcNavItem[]>();
  readonly ariaLabel = input('Navegación de sección');
}
