import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Notify the containing demo only after stored state has hydrated. */
export function useWebDemoReady(ready: boolean) {
  useEffect(() => {
    if (
      !ready ||
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      window.parent === window
    )
      return;
    const session = new URLSearchParams(window.location.search).get('sessao');
    if (!session) return;
    window.parent.postMessage({ type: 'trinca:ready', session }, '*');
  }, [ready]);
}
