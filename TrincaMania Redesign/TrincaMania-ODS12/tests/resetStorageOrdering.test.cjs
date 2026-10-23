const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarTypeScript } = require('./lib/typescript.cjs');
registrarTypeScript();
const store = new Map();
let beforeRead;
let beforeWrite;
const storageId = require.resolve('@react-native-async-storage/async-storage');
require.cache[storageId] = {
  id: storageId,
  filename: storageId,
  loaded: true,
  exports: {
    __esModule: true,
    default: {
      getItem: async (key) => {
        const snapshot = store.get(key) ?? null;
        await beforeRead?.(key);
        return snapshot;
      },
      setItem: async (key, value) => {
        await beforeWrite?.(key, value);
        store.set(key, value);
      },
    },
  },
};
const boost = require('../src/storage/trayBoostStorage.ts');
const rescue = require('../src/storage/magicTripleRescueStorage.ts');
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
test.beforeEach(() => {
  store.clear();
  beforeRead = undefined;
  beforeWrite = undefined;
});

test('refresh de bandeja iniciado antes do reset não ressuscita espaços', async () => {
  const key = boost.TRAY_BOOST_STORAGE_KEY;
  store.set(
    key,
    JSON.stringify({
      coinSlotExpiresAt: Date.now() + 100000,
      adSlotExpiresAt: null,
    }),
  );
  const entered = deferred();
  const release = deferred();
  beforeRead = async () => {
    entered.resolve();
    await release.promise;
  };
  const refresh = boost.getTrayBoostState();
  await entered.promise;
  const reset = boost.resetTrayBoostState();
  release.resolve();
  await Promise.all([refresh, reset]);
  assert.deepEqual(
    JSON.parse(store.get(key)),
    boost.createInitialTrayBoostState(),
  );
});

test('ativações concorrentes preservam ambos espaços e compra duplicada só concede uma vez', async () => {
  const [purchase, bonus, duplicate] = await Promise.all([
    boost.purchaseCoinTraySlot(150),
    boost.activateBonusTraySlot(),
    boost.purchaseCoinTraySlot(150),
  ]);
  assert.equal(purchase.purchased, true);
  assert.equal(bonus.activated, true);
  assert.equal(duplicate.purchased, false);
  const state = await boost.getTrayBoostState();
  assert.ok(state.coinSlotExpiresAt > Date.now());
  assert.ok(state.adSlotExpiresAt > Date.now());
  await boost.resetTrayBoostState();
  assert.deepEqual(
    await boost.getTrayBoostState(),
    boost.createInitialTrayBoostState(),
  );
});

test('falha na gravação de refresh propaga sem apagar dados e não bloqueia reset', async () => {
  const key = boost.TRAY_BOOST_STORAGE_KEY;
  const previous = JSON.stringify({
    coinSlotExpiresAt: Date.now() + 100000,
    adSlotExpiresAt: null,
  });
  store.set(key, previous);
  let failures = 1;
  beforeWrite = async () => {
    if (failures-- > 0) throw new Error('storage indisponível');
  };
  await assert.rejects(boost.getTrayBoostState(), /storage indisponível/);
  assert.equal(store.get(key), previous);
  await boost.resetTrayBoostState();
  assert.deepEqual(
    JSON.parse(store.get(key)),
    boost.createInitialTrayBoostState(),
  );
});

test('reset de resgate espera gravação iniciada e leitura seguinte observa reset', async () => {
  const entered = deferred();
  const release = deferred();
  let writes = 0;
  beforeWrite = async () => {
    if (++writes === 1) {
      entered.resolve();
      await release.promise;
    }
  };
  const save = rescue.saveMagicTripleRescueState({
    rescueUsed: true,
    tutorialSeenCount: 2,
  });
  await entered.promise;
  const reset = rescue.resetMagicTripleRescueState();
  const read = rescue.loadMagicTripleRescueState();
  release.resolve();
  await Promise.all([save, reset]);
  assert.deepEqual(await read, rescue.createInitialMagicTripleRescueState());
});

for (const domain of [boost, rescue]) {
  const isBoost = domain === boost;
  test(`reset ${isBoost ? 'bandeja' : 'resgate'} com falha é recuperável pela próxima tentativa`, async () => {
    let failures = 1;
    beforeWrite = async () => {
      if (failures-- > 0) throw new Error('falha de escrita');
    };
    const reset = isBoost
      ? boost.resetTrayBoostState
      : rescue.resetMagicTripleRescueState;
    await assert.rejects(reset(), /falha de escrita/);
    await reset();
    const state = await (isBoost
      ? boost.getTrayBoostState()
      : rescue.loadMagicTripleRescueState());
    assert.deepEqual(
      state,
      isBoost
        ? boost.createInitialTrayBoostState()
        : rescue.createInitialMagicTripleRescueState(),
    );
  });
}
