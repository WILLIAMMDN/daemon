import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import es from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideSpinnerConfig } from 'ngx-spinner';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';

registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideNzI18n(es_ES),
    provideSpinnerConfig({ type: 'square-jelly-box' }),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};
