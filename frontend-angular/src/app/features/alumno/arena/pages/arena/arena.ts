import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArcArea } from '../../../../../shared/componentes/arc-area/arc-area';
import { ArcNavItem } from '../../../../../shared/componentes/arc-local-nav/arc-local-nav';
import { ArcSection } from '../../../../../shared/componentes/arc-section/arc-section';
import { EstadoVacio } from '../../../../../shared/componentes/estado-vacio/estado-vacio';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-arena',
  imports: [ArcArea, ArcSection, EstadoVacio],
  templateUrl: './arena.html',
  styleUrl: './arena.scss',
})
export class Arena {
  readonly items: ArcNavItem[] = [
    { etiqueta: 'Competencia', ruta: '/alumno/arena' },
  ];
}
