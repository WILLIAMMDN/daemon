import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { GoogleLoginProvider, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptores/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.googleClientId, {
              oneTapEnabled: false,
              prompt: 'select_account',
            }),
          },
        ],
        onError: (err) => {
          console.error('Error de Google Login:', err);
        },
      } as SocialAuthServiceConfig,
    },
    provideHttpClient(withInterceptors([tokenInterceptor])),
  ],
};
