const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
const {
  createExclusiveBrowserTestStorage,
  OTHER_TAB_MESSAGE,
  LOCK_UNAVAILABLE_MESSAGE,
} = require('../src/storage/browserStorageLease.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
function lockManager() {
  let held = false;
  let requests = 0;
  return {
    request: async (_name, _options, callback) => {
      requests++;
      if (held) return callback(null);
      held = true;
      try {
        await callback({});
      } finally {
        held = false;
      }
    },
    count: () => requests,
  };
}
function persistent() {
  const values = new Map();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    values,
  };
}

test('same-page consumers share one lease and preserve namespace', async () => {
  const locks = lockManager();
  const disk = persistent();
  const storage = createExclusiveBrowserTestStorage(disk, locks);
  await Promise.all(
    Array.from({ length: 20 }, (_, n) => storage.setItem(`key${n}`, `${n}`)),
  );
  assert.equal(locks.count(), 1);
  assert.equal(await storage.getItem('key19'), '19');
  assert.equal(disk.values.get('@trinca-web-test/key19'), '19');
  storage.release();
  await tick();
});

test('second tab fails closed, then retries and reads first tab changes after release', async () => {
  const locks = lockManager();
  const disk = persistent();
  const first = createExclusiveBrowserTestStorage(disk, locks);
  const second = createExclusiveBrowserTestStorage(disk, locks);
  await first.setItem('wallet', 'first');
  await assert.rejects(second.getItem('wallet'), {
    message: OTHER_TAB_MESSAGE,
  });
  await assert.rejects(second.setItem('wallet', 'stale'), {
    message: OTHER_TAB_MESSAGE,
  });
  assert.equal(await first.getItem('wallet'), 'first');
  first.release();
  await tick();
  assert.equal(await second.getItem('wallet'), 'first');
  await second.setItem('wallet', 'second');
  await assert.rejects(
    first.setItem('wallet', 'stale-after-pagehide'),
    /sessão foi encerrada/,
  );
  second.release();
  await tick();
});

test('without Web Locks API no persistent read or write is attempted', async () => {
  const disk = persistent();
  const storage = createExclusiveBrowserTestStorage(disk, undefined);
  await assert.rejects(storage.getItem('wallet'), {
    message: LOCK_UNAVAILABLE_MESSAGE,
  });
  await assert.rejects(storage.setItem('wallet', 'unsafe'), {
    message: LOCK_UNAVAILABLE_MESSAGE,
  });
  assert.equal(disk.values.size, 0);
});

test('pagehide waits for an in-flight write before releasing ownership', async () => {
  const locks = lockManager();
  const disk = persistent();
  let releaseWrite;
  const hold = new Promise((resolve) => {
    releaseWrite = resolve;
  });
  const delayed = {
    getItem: disk.getItem,
    setItem: async (key, value) => {
      await hold;
      await disk.setItem(key, value);
    },
  };
  const first = createExclusiveBrowserTestStorage(delayed, locks);
  const second = createExclusiveBrowserTestStorage(disk, locks);
  const writing = first.setItem('wallet', 'durable');
  await tick();
  first.release();
  await assert.rejects(second.getItem('wallet'), {
    message: OTHER_TAB_MESSAGE,
  });
  releaseWrite();
  await writing;
  await tick();
  assert.equal(await second.getItem('wallet'), 'durable');
  second.release();
  await tick();
});

test('page closes while lock acquisition is pending without leaking the lease', async () => {
  const locks = lockManager();
  const disk = persistent();
  const first = createExclusiveBrowserTestStorage(disk, locks);
  const pending = first.getItem('wallet');
  first.release();
  await assert.rejects(pending, /sessão foi encerrada/);
  await tick();
  const second = createExclusiveBrowserTestStorage(disk, locks);
  assert.equal(await second.getItem('wallet'), null);
  second.release();
  await tick();
});
