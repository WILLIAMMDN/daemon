import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activos } from '../../servicios/activos';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(public activos: Activos) {}
}
