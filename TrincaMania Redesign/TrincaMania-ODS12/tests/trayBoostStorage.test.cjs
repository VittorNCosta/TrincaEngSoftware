const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarTypeScript } = require('./lib/typescript.cjs');
registrarTypeScript();

const store = new Map();
const storageId = require.resolve('@react-native-async-storage/async-storage');
require.cache[storageId] = {
  id: storageId,
  filename: storageId,
  loaded: true,
  exports: {
    __esModule: true,
    default: {
      getItem: async (key) => store.get(key) ?? null,
      setItem: async (key, value) => {
        store.set(key, value);
      },
    },
  },
};
const boost = require('../src/storage/trayBoostStorage.ts');
const key = boost.TRAY_BOOST_STORAGE_KEY;
const now = 1800000000000;
const empty = { adSlotExpiresAt: null, coinSlotExpiresAt: null };
const persisted = () => JSON.parse(store.get(key));
test.beforeEach((t) => {
  store.clear();
  t.mock.method(Date, 'now', () => now);
});

test('save ausente e JSON corrompido recuperam a capacidade base e persistem estado válido', async () => {
  assert.deepEqual(await boost.getTrayBoostState(), empty);
  assert.deepEqual(persisted(), empty);
  store.set(key, '{inválido');
  assert.deepEqual(await boost.getTrayBoostState(), empty);
  assert.deepEqual(persisted(), empty);
});

test('estados inválidos e expiração no instante exato não concedem espaço grátis', async () => {
  for (const value of [
    null,
    [],
    'texto',
    2,
    { coinSlotExpiresAt: now, adSlotExpiresAt: 'amanhã' },
  ]) {
    store.set(key, JSON.stringify(value));
    assert.deepEqual(await boost.getTrayBoostState(), empty);
    assert.deepEqual(persisted(), empty);
  }
  store.set(
    key,
    JSON.stringify({ coinSlotExpiresAt: now + 1000, adSlotExpiresAt: now - 1 }),
  );
  assert.deepEqual(await boost.getTrayBoostState(), {
    coinSlotExpiresAt: now + 1000,
    adSlotExpiresAt: null,
  });
});

test('compra rejeita saldo insuficiente e ativa exatamente 24 horas com saldo exato', async () => {
  const denied = await boost.purchaseCoinTraySlot(149);
  assert.equal(denied.purchased, false);
  assert.equal(denied.reason, 'insufficient-coins');
  assert.deepEqual(persisted(), empty);
  const bought = await boost.purchaseCoinTraySlot(150);
  assert.equal(bought.purchased, true);
  assert.deepEqual(bought.state, {
    adSlotExpiresAt: null,
    coinSlotExpiresAt: now + 86400000,
  });
  assert.deepEqual(persisted(), bought.state);
  const repeated = await boost.purchaseCoinTraySlot(999);
  assert.equal(repeated.purchased, false);
  assert.equal(repeated.reason, 'active');
  assert.deepEqual(persisted(), bought.state);
});

test('bônus dura 30 minutos e reativação não estende o prazo', async () => {
  const first = await boost.activateBonusTraySlot();
  assert.equal(first.activated, true);
  assert.equal(first.state.adSlotExpiresAt, now + 1800000);
  const repeated = await boost.activateBonusTraySlot();
  assert.equal(repeated.activated, false);
  assert.equal(repeated.reason, 'active');
  assert.deepEqual(persisted(), first.state);
});

test('dois espaços ativos expiram independentemente e nunca excedem nove', () => {
  const state = {
    coinSlotExpiresAt: now + 86400000,
    adSlotExpiresAt: now + 1800000,
  };
  assert.equal(boost.getActiveTrayCapacity(empty), 7);
  assert.equal(boost.getActiveTrayCapacity(state), 9);
  assert.equal(boost.getActiveTrayCapacity(state, now + 1800000), 8);
  assert.equal(boost.getActiveTrayCapacity(state, now + 86400000), 7);
  assert.equal(boost.getCoinTraySlotRemaining(state), 86400000);
  assert.equal(boost.getBonusTraySlotRemaining(state), 1800000);
  assert.equal(boost.getCoinTraySlotRemaining(state, now + 86400000), 0);
  assert.equal(boost.getBonusTraySlotRemaining(state, now + 1800000), 0);
  assert.deepEqual(boost.getTraySlotStatus(empty), [
    ...Array(7).fill('active'),
    'coin-locked',
    'ad-locked',
  ]);
  assert.deepEqual(boost.getTraySlotStatus(state), Array(9).fill('active'));
});

test('consumir bônus de uma fase preserva o espaço comprado e é idempotente', async () => {
  await boost.purchaseCoinTraySlot(150);
  const unlocked = await boost.unlockAdTraySlotForOneLevel();
  assert.equal(unlocked.adSlotExpiresAt, Number.MAX_SAFE_INTEGER);
  const consumed = await boost.consumeAdTraySlotIfNeeded();
  assert.deepEqual(consumed, {
    adSlotExpiresAt: null,
    coinSlotExpiresAt: now + 86400000,
  });
  assert.deepEqual(persisted(), consumed);
  assert.deepEqual(await boost.consumeAdTraySlotIfNeeded(), consumed);
  assert.deepEqual(await boost.resetTrayBoostState(), empty);
  assert.deepEqual(persisted(), empty);
});

test('tempo restante arredonda minutos para cima e não exibe duração negativa', () => {
  assert.equal(boost.formatTrayBoostRemaining(-1000), '0m');
  assert.equal(boost.formatTrayBoostRemaining(1), '1m');
  assert.equal(boost.formatTrayBoostRemaining(60000), '1m');
  assert.equal(boost.formatTrayBoostRemaining(3600000), '1h 00m');
  assert.equal(boost.formatTrayBoostRemaining(3660000), '1h 01m');
});

test('falha de persistência não confirma compra nem ativação de bônus', async (t) => {
  // O chamador só deve descontar moedas depois de uma compra confirmada.
  // Simula o armazenamento nativo indisponível, inclusive na inicialização.
  t.mock.method(
    require.cache[storageId].exports.default,
    'setItem',
    async () => {
      throw new Error('storage indisponível');
    },
  );
  await assert.rejects(boost.purchaseCoinTraySlot(150), /storage indisponível/);
  await assert.rejects(boost.activateBonusTraySlot(), /storage indisponível/);
  assert.equal(store.has(key), false);
});
