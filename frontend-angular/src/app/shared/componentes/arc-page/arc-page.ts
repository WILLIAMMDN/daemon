import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

export interface ArcMiga {
  etiqueta: string;
  ruta?: string;
}

/**
 * Envoltorio estructural de una página del estudiante (DAEMON ARC).
 *
 * Aporta el encabezado editorial (h1 + descripción corta + contexto + acción
 * principal) y el contenedor del contenido. La navegación local se proyecta en
 * `[nav]` para que quede justo debajo del encabezado en todas las áreas.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-arc-page',
  imports: [RouterLink, NzBreadCrumbModule],
  templateUrl: './arc-page.html',
  styleUrl: './arc-page.scss',
})
export class ArcPage {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null | undefined>(null);
  /** Contexto de navegación ascendente. Se omite en las páginas raíz de cada área. */
  readonly migas = input<ArcMiga[]>([]);
  /** Oculta el encabezado cuando la página anfitriona ya lo pinta (rutas hijas). */
  readonly encabezado = input(true);
}
