import { Component , ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tarjeta-resumen',
  imports: [],
  templateUrl: './tarjeta-resumen.html',
  styleUrl: './tarjeta-resumen.scss',
})
export class TarjetaResumen {}
