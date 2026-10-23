/** Readiness handshake for the embedded web app. Native and standalone use are inert. */
export function connectWebHost(state: {
  ready: boolean;
  error?: boolean;
  sessionActive: boolean;
}): () => void {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !window.location ||
    !window.parent ||
    window.parent === window
  )
    return () => {};
  const query = new URLSearchParams(window.location.search);
  const session = query.get('hostSession');
  const hostOrigin = query.get('hostOrigin');
  // Compatibility with the existing simulator until its audited host is deployed.
  // Never broadcast readiness to an unspecified origin or register legacy commands.
  if (!session && query.get('sessao')) {
    try {
      const origin = new URL(document.referrer).origin;
      if (origin !== 'null' && state.ready && !state.error)
        window.parent.postMessage(
          { type: 'trinca:ready', session: query.get('sessao') },
          origin,
        );
    } catch {
      // No trustworthy referrer means no legacy handshake.
    }
    return () => {};
  }
  if (!session || !hostOrigin) return () => {};
  try {
    // A query string alone cannot authorize an unrelated parent.
    if (new URL(document.referrer).origin !== hostOrigin) return () => {};
    if (new URL(hostOrigin).origin !== hostOrigin) return () => {};
  } catch {
    return () => {};
  }
  const send = () => {
    if (state.ready || state.error)
      window.parent.postMessage(
        {
          channel: 'ods12-host',
          version: 1,
          type: state.error ? 'error' : 'ready',
          session,
          sessionActive: state.sessionActive,
        },
        hostOrigin,
      );
  };
  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (
      event.source !== window.parent ||
      event.origin !== hostOrigin ||
      !data ||
      data.channel !== 'ods12-host' ||
      data.version !== 1 ||
      data.session !== session
    )
      return;
    if (data.type === 'ping') send();
    if (data.type === 'focus' && (state.ready || state.error)) {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const target =
        dialog?.querySelector<HTMLElement>(
          'button:not([disabled]), [role="button"][tabindex="0"], [tabindex="0"]',
        ) ??
        dialog ??
        document.querySelector<HTMLElement>(
          '[role="main"], main, h1, button:not([disabled]), [role="button"][tabindex="0"]',
        );
      if (target) {
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }
  };
  window.addEventListener('message', onMessage);
  send();
  return () => window.removeEventListener('message', onMessage);
}
