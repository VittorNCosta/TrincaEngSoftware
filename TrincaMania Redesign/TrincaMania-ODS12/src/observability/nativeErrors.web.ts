import { installGlobalErrorHandlers } from './globalErrors';
import { reportRemoteError } from './errorReporter';
import { log } from '../utils/log';

export function installNativeErrorHandlers() {
  const cleanup = installGlobalErrorHandlers();
  const onError = (event: ErrorEvent) => {
    log('error', 'runtime', 'unhandled-error', event.error ?? event.message);
    reportRemoteError(event.error ?? event.message);
  };
  window.addEventListener('error', onError);
  return () => {
    cleanup();
    window.removeEventListener('error', onError);
  };
}
