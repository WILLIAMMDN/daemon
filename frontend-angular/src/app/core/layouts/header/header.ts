import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activos } from '../../servicios/activos';
import { ImageFallbackDirective } from '../../../shared/directivas/image-fallback.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink, ImageFallbackDirective],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(public activos: Activos) {}
}
