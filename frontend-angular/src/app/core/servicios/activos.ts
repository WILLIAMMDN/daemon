import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Activos {
  private readonly baseCloud = (environment.assetBaseUrl ?? '').replace(/\/+$/, '');

  url(ruta?: string | null): string {
    const limpia = ruta?.trim();

    if (!limpia) {
      return '';
    }

    if (/^(https?:|data:|blob:)/i.test(limpia)) {
      return limpia;
    }

    const normalizada = limpia.replace(/^\/+/, '');
    const rutaFinal = normalizada === 'img/bot_default.png' ? 'img/bot_default.svg' : normalizada;

    if (rutaFinal.startsWith('uploads/') && this.baseCloud) {
      return `${this.baseCloud}/${rutaFinal}`;
    }

    return `/${rutaFinal}`;
  }
}
