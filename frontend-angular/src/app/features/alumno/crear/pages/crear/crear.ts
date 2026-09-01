import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear',
  imports: [RouterOutlet, ArcArea],
  templateUrl: './crear.html',
  styleUrl: './crear.scss',
})
export class Crear {
  readonly items: ArcNavItem[] = [
    { etiqueta: 'Mis proyectos', ruta: 'proyectos' },
    { etiqueta: 'Estudio', ruta: 'estudio' },
    { etiqueta: 'Herramientas', ruta: 'herramientas' },
    { etiqueta: 'Portafolio', ruta: 'portafolio' },
  ];
}
