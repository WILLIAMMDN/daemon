import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque de contenido con encabezado propio dentro de una página del estudiante.
 * No dibuja tarjeta: la tarjeta se reserva para objetos autocontenidos.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-arc-section',
  templateUrl: './arc-section.html',
  styleUrl: './arc-section.scss',
})
export class ArcSection {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null | undefined>(null);
  /** Nivel del encabezado para conservar el orden semántico de la página. */
  readonly nivel = input<2 | 3>(2);
}
