import { Component, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { KeepAlive } from './core/servicios/keep-alive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  private readonly keepAlive = inject(KeepAlive);

  constructor() {
    // Mantiene Render despierto mientras alguien usa el portal.
    this.keepAlive.iniciar();
  }

  ngOnDestroy(): void {
    this.keepAlive.detener();
  }
}