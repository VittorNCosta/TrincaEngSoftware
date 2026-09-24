/** Local diagnostics only: no persistence, network or player identifiers. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type DiagnosticContext = {
  screen?: string;
  worldId?: number;
  levelId?: string;
  retry?: boolean;
  seed?: number | string;
};
export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  detail?: string;
  context: DiagnosticContext;
};
const entries: LogEntry[] = [];
let context: DiagnosticContext = {};
const clean = (value: string) =>
  value
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/([?&](?:token|key|password|secret)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .slice(0, 4000);
export function setDiagnosticContext(next: DiagnosticContext) {
  context = { ...next };
}
export function updateDiagnosticContext(next: DiagnosticContext) {
  context = { ...context, ...next };
}
export function getDiagnosticEntries(): LogEntry[] {
  return entries.map((entry) => ({ ...entry, context: { ...entry.context } }));
}
export function diagnosticReport() {
  return JSON.stringify({ format: 1, logs: getDiagnosticEntries() }, null, 2);
}
export function log(
  level: LogLevel,
  namespace: string,
  message: string,
  error?: unknown,
) {
  // Logging must never replace the original failure with a serialization failure.
  try {
    const development = typeof __DEV__ !== 'undefined' && __DEV__;
    if (!development && (level === 'debug' || level === 'info')) return;
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}${development && error.stack ? `\n${error.stack}` : ''}`
        : error === undefined
          ? undefined
          : String(error);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      namespace: clean(namespace),
      message: clean(message),
      detail: detail === undefined ? undefined : clean(detail),
      context: { ...context },
    };
    entries.push(entry);
    if (entries.length > 200) entries.shift();
    console[level](JSON.stringify(entry));
  } catch {
    /* Diagnostics cannot crash the game. */
  }
}
export function runtimeAssert(condition: unknown, invariant: string): boolean {
  if (!condition) log('error', 'invariant', invariant);
  return Boolean(condition);
}
