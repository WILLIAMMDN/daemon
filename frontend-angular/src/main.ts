import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';
import { assertEnvironmentContract } from './environments/environment.assert';

assertEnvironmentContract(environment);

if (environment.observability.sentryEnabled) {
  Sentry.init({
    dsn: environment.observability.sentryDsn,
    environment: environment.environmentName,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: environment.observability.tracesSampleRate,
    sendDefaultPii: false,
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
