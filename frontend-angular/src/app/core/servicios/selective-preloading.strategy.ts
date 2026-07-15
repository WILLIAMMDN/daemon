import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

interface NetworkInformation {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
}

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true || this.conexionLimitada()) {
      return of(null);
    }

    return load();
  }

  private conexionLimitada(): boolean {
    if (typeof navigator === 'undefined') return true;

    const conexion = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    return Boolean(conexion?.saveData || ['slow-2g', '2g'].includes(conexion?.effectiveType ?? ''));
  }
}
