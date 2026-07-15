import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import es from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideSpinnerConfig } from 'ngx-spinner';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';
import { SelectivePreloadingStrategy } from './core/servicios/selective-preloading.strategy';

registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(
      routes,
      // Adelanta solo rutas frecuentes y respeta ahorro de datos o redes 2G.
      withPreloading(SelectivePreloadingStrategy),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideNzI18n(es_ES),
    provideSpinnerConfig({ type: 'square-jelly-box' }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
    provideCharts(withDefaultRegisterables()),
  ],
};
