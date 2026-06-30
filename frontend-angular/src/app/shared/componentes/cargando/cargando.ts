import { Component, Input } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-cargando',
  imports: [ProgressSpinner],
  templateUrl: './cargando.html',
  styleUrl: './cargando.scss',
})
export class Cargando {
  @Input() texto = 'Cargando información...';
  @Input() compacto = false;
}
