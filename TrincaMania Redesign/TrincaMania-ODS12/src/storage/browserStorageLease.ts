import {
  createBrowserTestStorage,
  type KeyValueStorage,
} from './webSessionStorage';

export const BROWSER_SAVE_LOCK = 'trinca-mania-web-test-save-v1';
export const OTHER_TAB_MESSAGE =
  'Seu progresso está aberto em outra aba. Feche a outra aba e tente novamente, ou escolha o modo Demonstração.';
export const LOCK_UNAVAILABLE_MESSAGE =
  'Este navegador não permite proteger o progresso entre abas. Use um navegador atualizado em HTTPS ou escolha o modo Demonstração.';
export type SaveLockManager = {
  request(
    name: string,
    options: { ifAvailable: true },
    callback: (lock: unknown | null) => Promise<void>,
  ): Promise<unknown>;
};

/** Hold ownership for the complete mounted session, not only individual writes:
 * an unlocked second tab would otherwise retain stale in-memory snapshots.
 * One module-level adapter is shared by every storage consumer in the page. */
export function createExclusiveBrowserTestStorage(
  persistent: KeyValueStorage,
  locks: SaveLockManager | undefined,
) {
  const scoped = createBrowserTestStorage(persistent);
  let acquisition: Promise<void> | undefined;
  let releaseLock: (() => void) | undefined;
  let operations = 0;
  let releasing = false;
  let disposed = false;
  const finishRelease = () => {
    if (!releasing || operations !== 0) return;
    releaseLock?.();
    releaseLock = undefined;
    acquisition = undefined;
    releasing = false;
  };
  const acquire = () => {
    if (disposed)
      return Promise.reject(
        new Error(
          'A sessão foi encerrada. Recarregue a página para continuar.',
        ),
      );
    if (!locks) return Promise.reject(new Error(LOCK_UNAVAILABLE_MESSAGE));
    if (acquisition) return acquisition;
    const pending = new Promise<void>((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          locks.request(
            BROWSER_SAVE_LOCK,
            { ifAvailable: true },
            async (lock) => {
              if (!lock) {
                reject(new Error(OTHER_TAB_MESSAGE));
                return;
              }
              // A navigation can close the adapter while the lock request is pending.
              if (disposed) {
                reject(
                  new Error(
                    'A sessão foi encerrada. Recarregue a página para continuar.',
                  ),
                );
                return;
              }
              await new Promise<void>((release) => {
                releaseLock = release;
                resolve();
              });
            },
          ),
        )
        .catch(reject);
    });
    acquisition = pending;
    pending.catch(() => {
      if (acquisition === pending) acquisition = undefined;
    });
    return pending;
  };
  const withLease = async <T>(operation: () => Promise<T>): Promise<T> => {
    operations++;
    try {
      await acquire();
      return await operation();
    } finally {
      operations--;
      finishRelease();
    }
  };
  return {
    getItem: (key: string) => withLease(() => scoped.getItem(key)),
    setItem: (key: string, value: string) =>
      withLease(() => scoped.setItem(key, value)),
    /** Never release before an already-started storage operation settles. */
    release: () => {
      disposed = true;
      releasing = true;
      finishRelease();
    },
  };
}
