import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { ActiveGameClock } from '../utils/activeGameClock';

export function useActiveGameClock(
  clock: ActiveGameClock,
  running: boolean,
  onTick: (seconds: number) => void,
) {
  useEffect(() => {
    let appActive =
      !AppState.currentState || AppState.currentState === 'active';
    const web = Platform.OS === 'web' && typeof document !== 'undefined';
    const update = () => {
      clock.setRunning(
        running && appActive && (!web || document.visibilityState !== 'hidden'),
      );
      onTick(clock.readSeconds());
    };
    const subscription = AppState.addEventListener('change', (state) => {
      appActive = state === 'active';
      update();
    });
    if (web) document.addEventListener('visibilitychange', update);
    update();
    const interval = setInterval(() => onTick(clock.readSeconds()), 250);
    return () => {
      clearInterval(interval);
      subscription.remove();
      if (web) document.removeEventListener('visibilitychange', update);
      clock.setRunning(false);
    };
  }, [clock, running, onTick]);
}
