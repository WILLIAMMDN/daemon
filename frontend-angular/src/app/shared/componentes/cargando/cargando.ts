import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

@Component({
  selector: 'app-cargando',
  imports: [NzSpinModule, NzSkeletonModule],
  templateUrl: './cargando.html',
  styleUrl: './cargando.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cargando {
  @Input() texto = 'Cargando información...';
  @Input() compacto = false;
}
