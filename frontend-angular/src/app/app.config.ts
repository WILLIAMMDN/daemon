import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideSpinnerConfig } from 'ngx-spinner';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideSpinnerConfig({ type: 'square-jelly-box' }),
  ],
};
