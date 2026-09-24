import { reportRemoteError } from './errorReporter';
import { installGlobalErrorHandlers } from './globalErrors';
import { log } from '../utils/log';

type RejectionOptions = {
  allRejections: boolean;
  onUnhandled: (id: number, error: unknown) => void;
  onHandled: (id: number) => void;
};
type HermesHost = typeof globalThis & {
  HermesInternal?: {
    enablePromiseRejectionTracker?: (options: RejectionOptions) => void;
  };
};
/** RN 0.81 uses Hermes' tracker, not browser rejection events. */
export function installNativeErrorHandlers() {
  const cleanup = installGlobalErrorHandlers();
  const hermes = (globalThis as HermesHost).HermesInternal;
  if (hermes?.enablePromiseRejectionTracker) {
    // Preserve LogBox behavior in development while also keeping a local report.
    const defaults: RejectionOptions =
      // RN internal Flow module has no TypeScript declaration.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react-native/Libraries/promiseRejectionTrackingOptions').default;
    hermes.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled(id, error) {
        log('error', 'promise', 'unhandled-rejection', error);
        reportRemoteError(error);
        if (__DEV__) defaults.onUnhandled(id, error);
      },
      onHandled(id) {
        if (__DEV__) defaults.onHandled(id);
      },
    });
    return () => {
      cleanup();
      hermes.enablePromiseRejectionTracker?.(
        __DEV__
          ? defaults
          : {
              allRejections: false,
              onUnhandled() {},
              onHandled() {},
            },
      );
    };
  }
  return cleanup;
}
