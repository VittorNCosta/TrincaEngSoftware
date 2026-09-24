import { reportRemoteError } from './errorReporter';
import { log } from '../utils/log';

type Handler = (error: Error, fatal?: boolean) => void;
type ErrorHost = {
  ErrorUtils?: {
    getGlobalHandler: () => Handler;
    setGlobalHandler: (handler: Handler) => void;
  };
  addEventListener?: (
    name: string,
    listener: (event: { reason?: unknown }) => void,
  ) => void;
  removeEventListener?: (
    name: string,
    listener: (event: { reason?: unknown }) => void,
  ) => void;
};
/** Preserve the runtime's fatal handling; do not swallow crashes or suppress rejections. */
export function installGlobalErrorHandlers(
  host: ErrorHost = globalThis as ErrorHost,
) {
  const previous = host.ErrorUtils?.getGlobalHandler();
  const handler: Handler = (error, fatal) => {
    log('error', 'runtime', fatal ? 'fatal-error' : 'unhandled-error', error);
    reportRemoteError(error);
    previous?.(error, fatal);
  };
  host.ErrorUtils?.setGlobalHandler(handler);
  const rejected = (event: { reason?: unknown }) => {
    log('error', 'promise', 'unhandled-rejection', event.reason);
    reportRemoteError(event.reason);
  };
  host.addEventListener?.('unhandledrejection', rejected);
  return () => {
    if (previous && host.ErrorUtils?.getGlobalHandler() === handler)
      host.ErrorUtils.setGlobalHandler(previous);
    host.removeEventListener?.('unhandledrejection', rejected);
  };
}
