import { Component , ChangeDetectionStrategy} from '@angular/core';
import { Activos } from '../../servicios/activos';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  constructor(public activos: Activos) {}
}
