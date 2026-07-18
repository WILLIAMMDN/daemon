import { Injectable, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavegacionApp {
  private readonly activaInterna = signal(false);
  private suscripcion: Subscription | null = null;

  readonly activa = this.activaInterna.asReadonly();

  constructor(private readonly router: Router) {}

  iniciar(): void {
    if (this.suscripcion) return;

    this.suscripcion = this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.activaInterna.set(true);
        return;
      }

      if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError
      ) {
        this.activaInterna.set(false);
      }
    });
  }

  detener(): void {
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
    this.activaInterna.set(false);
  }
}
