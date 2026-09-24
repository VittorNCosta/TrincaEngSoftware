import { configureRemoteErrorReporter } from '../../observability/errorReporter';
import { installNativeErrorHandlers } from '../../observability/nativeErrors';
import { getDiagnosticEntries } from '../../utils/log';

jest.mock('react-native/Libraries/promiseRejectionTrackingOptions', () => ({
  __esModule: true,
  default: {
    allRejections: true,
    onUnhandled: jest.fn(),
    onHandled: jest.fn(),
  },
}));

test('Hermes rejection tracker records promise failures and cleanup restores runtime defaults', () => {
  const host = globalThis as typeof globalThis & { HermesInternal?: unknown };
  const previous = host.HermesInternal;
  const enablePromiseRejectionTracker = jest.fn();
  const output = jest.spyOn(console, 'error').mockImplementation(() => {});
  host.HermesInternal = { enablePromiseRejectionTracker };
  const remote = jest.fn();
  configureRemoteErrorReporter(remote);
  try {
    const cleanup = installNativeErrorHandlers();
    const tracker = enablePromiseRejectionTracker.mock.calls[0][0];
    tracker.onUnhandled(1, new Error('Hermes fixture'));
    expect(getDiagnosticEntries().at(-1)?.detail).toContain('Hermes fixture');
    expect(remote).toHaveBeenCalledTimes(1);
    cleanup();
    expect(enablePromiseRejectionTracker).toHaveBeenCalledTimes(2);
    expect(enablePromiseRejectionTracker.mock.calls[1][0]).not.toBe(tracker);
  } finally {
    configureRemoteErrorReporter();
    host.HermesInternal = previous;
    output.mockRestore();
  }
});
