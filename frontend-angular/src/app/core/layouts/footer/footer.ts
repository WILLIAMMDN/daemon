import { Component } from '@angular/core';
import { Activos } from '../../servicios/activos';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  constructor(public activos: Activos) {}
}
