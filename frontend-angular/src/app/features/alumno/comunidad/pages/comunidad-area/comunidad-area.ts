import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comunidad-area',
  imports: [RouterOutlet, ArcArea],
  templateUrl: './comunidad-area.html',
  styleUrl: './comunidad-area.scss',
})
export class ComunidadArea {
  readonly items: ArcNavItem[] = [
    { etiqueta: 'Descubrir', ruta: 'descubrir' },
    { etiqueta: 'Proyectos', ruta: 'proyectos' },
    { etiqueta: 'Perfiles', ruta: 'perfiles' },
    { etiqueta: 'Eventos', ruta: 'eventos' },
  ];
}
