import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { NavigationError, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActualizacionApp implements OnDestroy {
  private readonly updates = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly subs = new Subscription();
  private readonly claveRecarga = 'daemon_chunk_recovery_at';
  private readonly intervaloRecargaMs = 60_000;
  private iniciada = false;
  private recuperando = false;
  private versionLista = false;
  private revision?: Promise<boolean>;

  private readonly alErrorDeVentana = (event: ErrorEvent): void => {
    this.manejarPosibleErrorDeChunk(event.error ?? event.message);
  };

  private readonly alRechazoNoManejado = (event: PromiseRejectionEvent): void => {
    this.manejarPosibleErrorDeChunk(event.reason);
  };

  iniciar(): void {
    if (this.iniciada || !this.updates.isEnabled) {
      return;
    }

    this.iniciada = true;
    const ventana = this.document.defaultView;
    ventana?.addEventListener('error', this.alErrorDeVentana);
    ventana?.addEventListener('unhandledrejection', this.alRechazoNoManejado);

    this.subs.add(this.updates.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.versionLista = true;
      }
    }));
    this.subs.add(this.updates.unrecoverable.subscribe(() => this.recuperarAplicacion()));
    this.subs.add(this.router.events.pipe(
      filter((event): event is NavigationError => event instanceof NavigationError),
    ).subscribe((event) => this.manejarPosibleErrorDeChunk(event.error)));

    // Descarga la versión nueva en segundo plano, pero no interrumpe formularios
    // ni conversaciones activas. Solo se activa si el cliente queda roto.
    void this.revisarActualizacion();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  detener(): void {
    const ventana = this.document.defaultView;
    ventana?.removeEventListener('error', this.alErrorDeVentana);
    ventana?.removeEventListener('unhandledrejection', this.alRechazoNoManejado);
    this.subs.unsubscribe();
  }

  private manejarPosibleErrorDeChunk(error: unknown): void {
    const mensaje = error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? '');

    if (/ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(mensaje)) {
      this.recuperarAplicacion();
    }
  }

  private recuperarAplicacion(): void {
    const ventana = this.document.defaultView;
    if (!ventana || this.recuperando || this.recargaReciente(ventana)) {
      return;
    }

    this.recuperando = true;
    this.marcarRecarga(ventana);

    void this.revisarActualizacion()
      .then((encontrada) => (this.versionLista || encontrada) ? this.updates.activateUpdate() : false)
      .catch(() => false)
      .finally(() => ventana.location.reload());
  }

  private revisarActualizacion(): Promise<boolean> {
    if (!this.revision) {
      this.revision = this.updates.checkForUpdate()
        .catch(() => false)
        .finally(() => {
          this.revision = undefined;
        });
    }

    return this.revision;
  }

  private recargaReciente(ventana: Window): boolean {
    try {
      const ultima = Number(ventana.sessionStorage.getItem(this.claveRecarga) ?? 0);
      return Date.now() - ultima < this.intervaloRecargaMs;
    } catch {
      return false;
    }
  }

  private marcarRecarga(ventana: Window): void {
    try {
      ventana.sessionStorage.setItem(this.claveRecarga, String(Date.now()));
    } catch {
      // La recuperación sigue siendo válida aunque el navegador bloquee storage.
    }
  }
}
