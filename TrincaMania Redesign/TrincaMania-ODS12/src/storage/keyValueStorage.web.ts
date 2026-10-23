import AsyncStorage from '@react-native-async-storage/async-storage';
import { createVisitorStorage } from './webSessionStorage';
import { createExclusiveBrowserTestStorage } from './browserStorageLease';

const sessionMode =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('modo')
    : null;
const isolatedMode = sessionMode === 'feira' || sessionMode === 'dev';
const persistentStorage = isolatedMode
  ? undefined
  : createExclusiveBrowserTestStorage(
      AsyncStorage,
      typeof navigator !== 'undefined' ? navigator.locks : undefined,
    );

const storage = persistentStorage ?? createVisitorStorage();

if (persistentStorage && typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => persistentStorage.release());
  // A BFCache page retains stale React state after another tab owns the save.
  // Reload it before allowing further writes rather than reacquiring over it.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  });
}

export default storage;
