/** Optional privacy-controlled remote sink; never imports a native SDK. */
let reporter: ((error: Error) => void) | undefined;
let reported = new WeakSet<Error>();
export function configureRemoteErrorReporter(next?: (error: Error) => void) {
  reporter = next;
  reported = new WeakSet<Error>();
}
export function reportRemoteError(value: unknown) {
  if (!reporter) return;
  const error =
    value instanceof Error ? value : new Error('Unhandled non-Error rejection');
  if (reported.has(error)) return;
  reported.add(error);
  try {
    reporter(error);
  } catch {
    /* Reporting must not create another uncaught error. */
  }
}
