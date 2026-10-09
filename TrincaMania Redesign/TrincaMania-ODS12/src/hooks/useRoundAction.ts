import { useCallback, useRef, type RefObject } from 'react';

/** Async result belongs to the mounted round that requested it. */
export function useRoundAction<T>(
  perform: () => Promise<T>,
  apply: (result: T) => void,
  generation: RefObject<number>,
  mounted: RefObject<boolean>,
  onError?: () => void,
) {
  const pending = useRef(false);
  return useCallback(async () => {
    if (pending.current || !mounted.current) return;
    pending.current = true;
    const requestedGeneration = generation.current;
    try {
      const result = await perform();
      if (mounted.current && generation.current === requestedGeneration)
        apply(result);
    } catch {
      if (mounted.current && generation.current === requestedGeneration)
        onError?.();
    } finally {
      pending.current = false;
    }
  }, [perform, apply, generation, mounted, onError]);
}
