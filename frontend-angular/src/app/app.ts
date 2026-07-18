import { Component, OnDestroy, inject , ChangeDetectionStrategy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { KeepAlive } from './core/servicios/keep-alive';
import { ActualizacionApp } from './core/servicios/actualizacion-app';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  private readonly keepAlive = inject(KeepAlive);
  private readonly actualizacion = inject(ActualizacionApp);

  constructor() {
    // Mantiene Render despierto mientras alguien usa el portal.
    this.keepAlive.iniciar();
    this.actualizacion.iniciar();
  }

  ngOnDestroy(): void {
    this.keepAlive.detener();
    this.actualizacion.detener();
  }
}
