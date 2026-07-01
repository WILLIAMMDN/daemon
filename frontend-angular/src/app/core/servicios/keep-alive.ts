import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Sesion } from './sesion';

/**
 * Mantiene despierta la instancia de Render free-tier mientras hay
 * sesión activa. Render duerme el servicio tras ~15 min sin tráfico;
 * este servicio hace un ping silencioso cada 10 min cuando el usuario
 * está autenticado, así nadie sufre el "cold start" de 20-30 s.
 *
 * Diseño:
 *  - Solo ping cuando hay sesión iniciada (no antes del login).
 *  - Solo ping cuando la pestaña está visible (no malgasta batería
 *    ni tráfico con la pestaña en background).
 *  - Sin spinner, sin logs, sin afectar nada del usuario.
 */
@Injectable({ providedIn: 'root' })
export class KeepAlive {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(Sesion);
  private readonly doc = inject(DOCUMENT);

  private timer?: ReturnType<typeof setInterval>;
  private readonly intervaloMs = 10 * 60 * 1000; // 10 minutos

  iniciar(): void {
    if (this.timer) {
      return;
    }

    const tick = () => {
      if (!this.sesion.autenticado()) {
        return;
      }
      if (this.doc.hidden) {
        return;
      }
      const url = `${environment.apiUrl}/salud`;
      this.http.get(url, { responseType: 'text' }).subscribe({
        next: () => {},
        error: () => {},
      });
    };

    // Un primer ping al cabo de 60 s para arrancar limpio tras login.
    setTimeout(tick, 60 * 1000);
    this.timer = setInterval(tick, this.intervaloMs);
  }

  detener(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}