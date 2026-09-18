import * as Sentry from '@sentry/react-native';
import { configureRemoteErrorReporter } from './errorReporter';

// DSN é público; tokens de upload existem somente no ambiente de build.
const enabled =
  !__DEV__ &&
  process.env.EXPO_PUBLIC_E2E !== 'true' &&
  Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);

if (enabled) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    enableNative: false,
    enableAutoSessionTracking: false,
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    maxBreadcrumbs: 0,
    integrations: () => [],
    beforeSend(event) {
      // Mensagens e contexto arbitrário podem carregar save, texto ou IDs.
      // Mantemos apenas o stack necessário à simbolicação.
      delete event.user;
      delete event.request;
      delete event.extra;
      delete event.contexts;
      delete event.breadcrumbs;
      delete event.tags;
      delete event.server_name;
      delete event.transaction;
      if (event.message) event.message = 'Erro do aplicativo';
      for (const exception of event.exception?.values || []) {
        exception.value = 'Erro do aplicativo';
        for (const frame of exception.stacktrace?.frames || []) {
          delete frame.vars;
        }
      }
      return event;
    },
  });
  configureRemoteErrorReporter((error) => {
    Sentry.captureException(error);
  });
}

export const withErrorReporting = enabled
  ? Sentry.wrap
  : <T>(root: T): T => root;
