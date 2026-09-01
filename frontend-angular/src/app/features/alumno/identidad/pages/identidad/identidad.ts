import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-identidad',
  imports: [RouterOutlet, ArcArea],
  templateUrl: './identidad.html',
  styleUrl: './identidad.scss',
})
export class Identidad {
  readonly items: ArcNavItem[] = [
    { etiqueta: 'Resumen', ruta: 'resumen' },
    { etiqueta: 'Perfil', ruta: 'perfil' },
    { etiqueta: 'Progreso y logros', ruta: 'progreso' },
    { etiqueta: 'Personalización', ruta: 'personalizacion' },
    { etiqueta: 'Daems y tienda', ruta: 'daems' },
  ];
}
