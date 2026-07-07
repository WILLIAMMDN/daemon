import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import es from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideSpinnerConfig } from 'ngx-spinner';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';

registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(
      routes,
      // Pre-carga todos los chunks lazy en background después del primer paint.
      // Resultado: la segunda navegación a una sección ya no descarga JS, va instantánea.
      withPreloading(PreloadAllModules),
      // Restaura el scroll al顶部 al cambiar de ruta (evita scroll pegado).
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideNzI18n(es_ES),
    provideSpinnerConfig({ type: 'square-jelly-box' }),
  ],
};
