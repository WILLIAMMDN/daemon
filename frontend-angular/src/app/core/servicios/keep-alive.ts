import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Sesion } from './sesion';

/**
 * Mantiene despierta la instancia de Render free-tier.
 *
 * Render duerme el servicio tras ~15 min sin tráfico y el "cold start"
 * tarda 20-30 s. Ese arranque en frío era justo lo que sufría el login:
 * la pantalla de acceso se abre ANTES de tener sesión, así que el
 * backend solía estar dormido al pulsar "Ingresar" y la primera
 * petición esperaba (o superaba) el timeout.
 *
 * Solución en tres capas:
 *  1. Despertar inmediato: al arrancar la app (login, registro,
 *     recuperar clave...) se hace un ping silencioso para que Render
 *     empiece a despertar mientras la persona escribe sus credenciales.
 *  2. Fase de calentamiento: pings cortos adicionales durante los
 *     primeros ~45 s sin requerir sesión, cubriendo el tiempo real de
 *     arranque y a quien tarda un poco en pulsar "Ingresar".
 *  3. Keep-alive de sesión: cuando ya hay sesión iniciada, un ping
 *     cada 10 min (solo con pestaña visible) evita que duerma.
 *
 * Diseño:
 *  - Sin spinner, sin logs, sin afectar nada del usuario.
 *  - No malgasta tráfico con la pestaña en background.
 */
@Injectable({ providedIn: 'root' })
export class KeepAlive {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(Sesion);
  private readonly doc = inject(DOCUMENT);

  private timer?: ReturnType<typeof setInterval>;
  private calentamientoTimers: ReturnType<typeof setTimeout>[] = [];
  private readonly intervaloMs = 10 * 60 * 1000; // 10 minutos
  /** Pings de calentamiento en ms desde el arranque (sin requerir sesión). */
  private readonly calentamientoMs = [0, 15_000, 45_000];

  iniciar(): void {
    if (this.timer) {
      return;
    }

    // 1 y 2) Despertar pre-login: pings inmediatos y de calentamiento.
    this.calentamientoMs.forEach((ms) => {
      this.calentamientoTimers.push(setTimeout(() => this.ping(), ms));
    });

    // 3) Keep-alive mientras hay sesión activa y la pestaña es visible.
    const tick = () => {
      if (!this.sesion.autenticado()) {
        return;
      }
      this.ping();
    };

    // Un primer ping al cabo de 60 s para arrancar limpio tras login.
    this.calentamientoTimers.push(setTimeout(tick, 60 * 1000));
    this.timer = setInterval(tick, this.intervaloMs);
  }

  detener(): void {
    this.calentamientoTimers.forEach((timer) => clearTimeout(timer));
    this.calentamientoTimers = [];

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private ping(): void {
    if (this.doc.hidden) {
      return;
    }
    const url = `${environment.apiUrl}/salud`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: () => {},
      error: () => {},
    });
  }
}