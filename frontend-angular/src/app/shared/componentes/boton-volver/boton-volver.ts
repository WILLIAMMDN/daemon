import { Component , ChangeDetectionStrategy} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-boton-volver',
  imports: [],
  templateUrl: './boton-volver.html',
  styleUrl: './boton-volver.scss',
})
export class BotonVolver {}
