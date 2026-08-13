const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  createInitialProgress,
  purchasePowerUpTransaction,
  restorePurchasedPowerUpItem,
} = require('../src/storage/progressStorage.ts');
const { POWER_UP_COSTS } = require('../src/utils/gameLogic.ts');

const createProgressWithCoins = (coins, itemCounts = {}) => ({
  ...createInitialProgress(),
  coins,
  itemCounts: {
    ...createInitialProgress().itemCounts,
    ...itemCounts,
  },
});

test('compra com saldo exato nunca deixa moedas negativas', () => {
  const progress = createProgressWithCoins(POWER_UP_COSTS.hint);
  const result = purchasePowerUpTransaction(progress, 'hint', false);

  assert.ok(result);
  assert.equal(result.coins, 0);
  assert.equal(result.itemCounts.hint, 1);
  assert.equal(progress.coins, POWER_UP_COSTS.hint);
  assert.equal(progress.itemCounts.hint, 0);
});

test('saldo insuficiente rejeita a transacao sem alterar carteira ou inventario', () => {
  const progress = createProgressWithCoins(POWER_UP_COSTS.shuffle - 1, { shuffle: 2 });
  const before = structuredClone(progress);
  const result = purchasePowerUpTransaction(progress, 'shuffle', false);

  assert.equal(result, undefined);
  assert.deepEqual(progress, before);
});

test('comprar adiciona exatamente uma unidade pelo preco canonico', () => {
  const progress = createProgressWithCoins(200, { undo: 3 });
  const result = purchasePowerUpTransaction(progress, 'undo', false);

  assert.ok(result);
  assert.equal(result.coins, 200 - POWER_UP_COSTS.undo);
  assert.equal(result.itemCounts.undo, 4);
  assert.equal(result.itemCounts.hint, 0);
  assert.equal(result.itemCounts.shuffle, 0);
});

test('comprar e usar persiste desconto e consumo no mesmo snapshot', () => {
  const progress = createProgressWithCoins(200, { shuffle: 2 });
  const result = purchasePowerUpTransaction(progress, 'shuffle', true);

  assert.ok(result);
  assert.equal(result.coins, 200 - POWER_UP_COSTS.shuffle);
  assert.equal(result.itemCounts.shuffle, 2);
});

test('segunda tentativa serializada usa o saldo atualizado e nao duplica compra', () => {
  const progress = createProgressWithCoins(POWER_UP_COSTS.undo);
  const first = purchasePowerUpTransaction(progress, 'undo', false);

  assert.ok(first);
  const second = purchasePowerUpTransaction(first, 'undo', false);

  assert.equal(second, undefined);
  assert.equal(first.coins, 0);
  assert.equal(first.itemCounts.undo, 1);
});

test('reinicio apos comprar-e-usar devolve a unidade sem devolver as moedas', () => {
  const progress = createProgressWithCoins(POWER_UP_COSTS.hint);
  const purchasedAndConsumed = purchasePowerUpTransaction(progress, 'hint', true);

  assert.ok(purchasedAndConsumed);
  const restored = restorePurchasedPowerUpItem(purchasedAndConsumed, 'hint');

  assert.equal(restored.coins, 0);
  assert.equal(restored.itemCounts.hint, 1);
  assert.equal(purchasedAndConsumed.itemCounts.hint, 0);
});
