import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { provideSpinnerConfig } from 'ngx-spinner';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideSpinnerConfig({ type: 'square-jelly-box' }),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};
