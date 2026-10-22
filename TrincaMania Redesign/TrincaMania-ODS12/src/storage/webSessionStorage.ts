export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/** One instance belongs to one visitor. Reloading the app discards it. */
export function createVisitorStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

/** Browser tests have their own namespace, independent of visitor sessions. */
export function createBrowserTestStorage(
  persistent: KeyValueStorage,
): KeyValueStorage {
  const prefix = '@trinca-web-test/';
  return {
    getItem: (key) => persistent.getItem(prefix + key),
    setItem: (key, value) => persistent.setItem(prefix + key, value),
  };
}

export type BrowserSessionMode = 'feira' | 'teste' | 'dev';

/** Native callers do not use this URL-based simulator contract. */
export const getBrowserSessionMode = (search: string): BrowserSessionMode => {
  const mode = new URLSearchParams(search).get('modo');
  return mode === 'dev' ? 'dev' : mode === 'feira' ? 'feira' : 'teste';
};

/** DEV and fair sessions are temporary and never access persistent saves. */
export const createWebSessionStorage = (
  persistent: KeyValueStorage,
  search: string,
): KeyValueStorage =>
  getBrowserSessionMode(search) === 'teste'
    ? createBrowserTestStorage(persistent)
    : createVisitorStorage();
