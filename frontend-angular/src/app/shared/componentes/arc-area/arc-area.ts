import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ArcLocalNav, ArcNavItem } from '../arc-local-nav/arc-local-nav';

/**
 * Contenedor de un área macro del estudiante: encabezado del área + navegación
 * local + contenido enrutado (proyectado).
 *
 * Varias rutas hijas son páginas ya existentes que traen su propio `<h1>`. Esas
 * rutas se marcan con `data: { arcTituloPropio: true }` y el área oculta su
 * encabezado para no romper el orden de encabezados de la página.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-arc-area',
  imports: [ArcLocalNav],
  templateUrl: './arc-area.html',
  styleUrl: './arc-area.scss',
})
export class ArcArea {
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null | undefined>(null);
  readonly items = input.required<ArcNavItem[]>();
  readonly ariaLabel = input('Navegación de sección');

  private readonly navegacion = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.tituloPropioDeLaRutaActiva()),
      startWith(this.tituloPropioDeLaRutaActiva()),
    ),
    { initialValue: false },
  );

  readonly mostrarEncabezado = computed(() => !this.navegacion());

  private tituloPropioDeLaRutaActiva(): boolean {
    let actual: ActivatedRoute | null = this.ruta;
    let propio = false;

    while (actual) {
      if (actual.snapshot?.data?.['arcTituloPropio'] === true) propio = true;
      actual = actual.firstChild;
    }

    return propio;
  }
}
