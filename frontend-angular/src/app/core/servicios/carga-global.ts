import { Injectable } from '@angular/core';
import { NgxSpinnerService, PRIMARY_SPINNER, Spinner } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class CargaGlobal {
  private readonly operacionesActivas = new Set<symbol>();
  private mostrarTimer?: ReturnType<typeof setTimeout>;
  private visible = false;

  constructor(private spinner: NgxSpinnerService) {}

  mostrar(_mensaje = 'Loading...', retrasoMs = 80): symbol {
    const token = Symbol('carga-global');
    this.operacionesActivas.add(token);

    if (!this.visible && !this.mostrarTimer) {
      this.mostrarTimer = setTimeout(() => {
        this.mostrarTimer = undefined;

        if (this.operacionesActivas.size > 0) {
          this.visible = true;
          void this.spinner.show(PRIMARY_SPINNER, this.opcionesSpinner());
        }
      }, retrasoMs);
    }

    return token;
  }

  ocultar(token?: symbol, esperaMs = 40): void {
    if (token) {
      this.operacionesActivas.delete(token);
    } else {
      this.operacionesActivas.clear();
    }

    if (this.operacionesActivas.size === 0) {
      if (this.mostrarTimer) {
        clearTimeout(this.mostrarTimer);
        this.mostrarTimer = undefined;
      }

      if (this.visible) {
        this.visible = false;
        void this.spinner.hide(PRIMARY_SPINNER, esperaMs);
      }
    }
  }

  cambiarMensaje(_mensaje: string): void {}

  private opcionesSpinner(): Spinner {
    return {
      bdColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fullScreen: true,
      size: 'medium',
      type: 'square-jelly-box',
    };
  }
}
