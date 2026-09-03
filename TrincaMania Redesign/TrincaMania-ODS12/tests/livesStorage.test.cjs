const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

// AsyncStorage real é assíncrono e nada barato: cada leitura e cada escrita cruza
// a ponte nativa. O mock reproduz esse atraso porque é exatamente nele que a
// corrida de leitura-modificação-escrita das vidas acontece.
const IO_DELAY_MS = 20;
const store = new Map();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asyncStorageMock = {
  async getItem(key) {
    await wait(IO_DELAY_MS);
    return store.has(key) ? store.get(key) : null;
  },
  async setItem(key, value) {
    await wait(IO_DELAY_MS);
    store.set(key, value);
  },
  async removeItem(key) {
    await wait(IO_DELAY_MS);
    store.delete(key);
  },
};

const asyncStorageId =
  require.resolve('@react-native-async-storage/async-storage');
require.cache[asyncStorageId] = {
  id: asyncStorageId,
  filename: asyncStorageId,
  loaded: true,
  children: [],
  paths: [],
  exports: { __esModule: true, default: asyncStorageMock },
};

const livesStorageId = require.resolve(
  path.join(__dirname, '..', 'src', 'storage', 'livesStorage.ts'),
);
const { LIVES_STORAGE_KEY, MAX_LIVES } = require(livesStorageId);

// A fila de mutação é estado de módulo: cada cenário parte de um módulo limpo.
const bootLives = (currentLives) => {
  store.clear();
  store.set(
    LIVES_STORAGE_KEY,
    JSON.stringify({
      currentLives,
      maxLives: MAX_LIVES,
      lastLifeTimestamp: Date.now(),
    }),
  );
  delete require.cache[livesStorageId];

  return require(livesStorageId);
};

const storedLives = () => JSON.parse(store.get(LIVES_STORAGE_KEY)).currentLives;

test('duas derrotas simultâneas cobram duas vidas, não uma', async () => {
  const lives = bootLives(3);

  const [first, second] = await Promise.all([
    lives.consumeLife(),
    lives.consumeLife(),
  ]);

  // Sem serialização as duas leituras enxergam 3 e as duas escrevem 2: a segunda
  // derrota sai de graça.
  assert.equal(storedLives(), 1);
  assert.deepEqual([first.currentLives, second.currentLives].sort(), [1, 2]);
});

test('duas vidas premiadas simultâneas somam duas, nenhuma se perde', async () => {
  const lives = bootLives(1);

  await Promise.all([lives.addLife(), lives.addLife()]);

  // Este é o caso caro: baú e ponto de descanso premiam junto e o jogador
  // recebia uma vida só.
  assert.equal(storedLives(), 3);
});

test('derrota e prêmio concorrentes se cancelam em vez de criar vida do nada', async () => {
  const lives = bootLives(3);

  await Promise.all([lives.consumeLife(), lives.addLife()]);

  assert.equal(storedLives(), 3);
});

test('três prêmios em rajada somam três', async () => {
  const lives = bootLives(0);

  await Promise.all([lives.addLife(), lives.addLife(), lives.addLife()]);

  assert.equal(storedLives(), 3);
});

test('o refil do reset também entra na fila e não é desfeito pela derrota em voo', async () => {
  const lives = bootLives(3);

  // Ordem de enfileiramento: a derrota primeiro, o refil depois. Sem a fila o
  // refil grava 5 no meio da derrota e a escrita atrasada da derrota o apaga.
  await Promise.all([lives.consumeLife(), lives.refillLives()]);

  assert.equal(storedLives(), MAX_LIVES);
});
