import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';
import { assertEnvironmentContract } from './environments/environment.assert';
import { registrarManejadorError } from './app/core/servicios/observabilidad';

assertEnvironmentContract(environment);

if (environment.observability.sentryEnabled) {
  Sentry.init({
    dsn: environment.observability.sentryDsn,
    environment: environment.environmentName,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: environment.observability.tracesSampleRate,
    sendDefaultPii: false,
  });

  // La telemetría se registra aquí para no duplicar el SDK de Sentry en el
  // bundle: observabilidad.ts nunca importa Sentry.
  registrarManejadorError((error, contexto) => {
    Sentry.captureException(error, {
      tags: {
        area: contexto.area,
        operacion: contexto.operacion,
        codigo: contexto.codigo,
      },
      extra: { recuperable: contexto.recuperable },
    });
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
