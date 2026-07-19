import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IllustrationSlot } from '../../../../shared/componentes/illustration-slot/illustration-slot';
import { CategoriaProyecto } from '../../models/proyecto.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tarjeta-categoria-proyecto',
  imports: [RouterLink, FontAwesomeModule, NzButtonModule, IllustrationSlot],
  templateUrl: './tarjeta-categoria-proyecto.html',
  styleUrl: './tarjeta-categoria-proyecto.scss',
})
export class TarjetaCategoriaProyecto {
  readonly categoria = input.required<CategoriaProyecto>();
  readonly icono = input.required<IconDefinition>();
  readonly imagen = input<string | null>(null);
  readonly assetName = input('');
  readonly faArrowRight = faArrowRight;
}
