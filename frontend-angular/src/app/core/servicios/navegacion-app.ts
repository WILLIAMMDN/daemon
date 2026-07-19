import { Injectable, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavegacionApp {
  private readonly duracionMinimaMs = 240;
  private readonly activaInterna = signal(false);
  private inicioNavegacion = 0;
  private ocultarTimer: ReturnType<typeof setTimeout> | null = null;
  private suscripcion: Subscription | null = null;

  readonly activa = this.activaInterna.asReadonly();

  constructor(private readonly router: Router) {}

  iniciar(): void {
    if (this.suscripcion) return;

    this.suscripcion = this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.cancelarOcultado();
        this.inicioNavegacion = Date.now();
        this.activaInterna.set(true);
        return;
      }

      if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError
      ) {
        this.ocultarCuandoSeaVisible();
      }
    });
  }

  detener(): void {
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
    this.cancelarOcultado();
    this.activaInterna.set(false);
  }

  private ocultarCuandoSeaVisible(): void {
    const transcurrido = Date.now() - this.inicioNavegacion;
    const restante = Math.max(0, this.duracionMinimaMs - transcurrido);
    this.cancelarOcultado();

    if (restante === 0) {
      this.activaInterna.set(false);
      return;
    }

    this.ocultarTimer = setTimeout(() => {
      this.ocultarTimer = null;
      this.activaInterna.set(false);
    }, restante);
  }

  private cancelarOcultado(): void {
    if (this.ocultarTimer === null) return;

    clearTimeout(this.ocultarTimer);
    this.ocultarTimer = null;
  }
}
