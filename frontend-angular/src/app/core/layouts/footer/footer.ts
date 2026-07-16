import { Component , ChangeDetectionStrategy} from '@angular/core';
import { Activos } from '../../servicios/activos';
import { ImageFallbackDirective } from '../../../shared/directivas/image-fallback.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [ImageFallbackDirective],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  constructor(public activos: Activos) {}
}
