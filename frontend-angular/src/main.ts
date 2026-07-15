import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

if (environment.observability.sentryEnabled) {
  Sentry.init({
    dsn: environment.observability.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: environment.observability.tracesSampleRate,
    sendDefaultPii: false,
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

