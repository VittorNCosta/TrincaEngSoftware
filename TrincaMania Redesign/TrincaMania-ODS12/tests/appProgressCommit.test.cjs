const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

const compile = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      jsxFactory: '__jsx',
      jsxFragmentFactory: '__jsxFragment',
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;

// A árvore de elementos vira dado inspecionável: é assim que o teste alcança os
// handlers que o App entrega às telas sem precisar de um renderer nativo.
globalThis.__jsx = (type, props, ...children) => ({
  type,
  props: props || {},
  children,
});
globalThis.__jsxFragment = 'Fragment';

const stub = (request, exports) => {
  const filename = require.resolve(request, { paths: [ROOT] });

  require.cache[filename] = {
    id: filename,
    filename,
    loaded: true,
    children: [],
    paths: [],
    exports,
  };
};

// Mesmo mock atrasado do teste de vidas: a fila de progresso só é observável
// quando a escrita leva tempo.
const IO_DELAY_MS = 15;
const store = new Map();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let interceptWrite;
const asyncStorageMock = {
  async getItem(key) {
    await wait(IO_DELAY_MS);
    return store.has(key) ? store.get(key) : null;
  },
  async setItem(key, value) {
    await wait(IO_DELAY_MS);
    if (interceptWrite) await interceptWrite(key, value);
    store.set(key, value);
  },
  async removeItem(key) {
    await wait(IO_DELAY_MS);
    store.delete(key);
  },
};

stub('@react-native-async-storage/async-storage', {
  __esModule: true,
  default: asyncStorageMock,
});
stub('expo-status-bar', { StatusBar: 'StatusBar' });
stub('react-native', {
  Platform: { OS: 'android' },
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: (sheet) => sheet, absoluteFillObject: {} },
  Text: 'Text',
  View: 'View',
});
stub('react-native-safe-area-context', {
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
});

const projectModule = (relativePath) => path.join(ROOT, relativePath);

stub(projectModule('src/components/PrimaryButton'), {
  PrimaryButton: 'PrimaryButton',
});
stub(projectModule('src/components/CampaignResizeNoticeModal'), {
  CampaignResizeNoticeModal: 'CampaignResizeNoticeModal',
});
stub(projectModule('src/components/MysteryTutorialModal'), {
  MysteryTutorialModal: 'MysteryTutorialModal',
});
stub(projectModule('src/components/NoLivesModal'), {
  NoLivesModal: 'NoLivesModal',
});
stub(projectModule('src/components/SettingsModal'), {
  SettingsModal: 'SettingsModal',
});
stub(projectModule('src/components/RoutineModal'), {
  RoutineModal: 'RoutineModal',
});
stub(projectModule('src/components/TutorialModal'), {
  TutorialModal: 'TutorialModal',
});
stub(projectModule('src/components/WorldChestModal'), {
  WorldChestModal: 'WorldChestModal',
});
stub(projectModule('src/navigation/MainTabs'), { MainTabs: 'MainTabs' });
stub(projectModule('src/screens/ChaptersScreen'), {
  ChaptersScreen: 'ChaptersScreen',
});
stub(projectModule('src/screens/GameScreen'), { GameScreen: 'GameScreen' });
stub(projectModule('src/screens/ShopScreen'), { ShopScreen: 'ShopScreen' });
stub(projectModule('src/screens/SplashIntroScreen'), {
  SplashIntroScreen: 'SplashIntroScreen',
});
stub(projectModule('src/utils/sounds'), {
  setSoundEnabled: async () => undefined,
  playRewardCollectSound: () => undefined,
  releaseSoundPlayers: () => undefined,
});
stub(projectModule('src/utils/music'), {
  installMusicLifecycle: () => () => undefined,
  setMusicEnabled: () => undefined,
  playMetaMusic: () => undefined,
  playWorldMusic: () => undefined,
  releaseMusicPlayer: () => undefined,
});
stub(projectModule('src/utils/voiceOver'), {
  releaseVoiceOverPlayers: () => undefined,
});

// Runtime de hooks mínimo: só o suficiente para o App executar de verdade — os
// mesmos refs, a mesma fila, os mesmos efeitos.
const depsEqual = (previous, next) =>
  Boolean(previous) &&
  Boolean(next) &&
  previous.length === next.length &&
  previous.every((value, index) => Object.is(value, next[index]));

const createHookRuntime = () => {
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  let isDirty = false;

  const slotAt = (index, create) => {
    if (!(index in slots)) {
      slots[index] = create();
    }

    return slots[index];
  };

  const runtime = {
    useState(initial) {
      const slot = slotAt(cursor++, () => ({
        value: typeof initial === 'function' ? initial() : initial,
      }));

      // React mantém a identidade do setter entre renders; hooks extraídos
      // dependem dessa garantia para não repetir a hidratação do save.
      slot.set ??= (next) => {
        const value = typeof next === 'function' ? next(slot.value) : next;

        if (!Object.is(value, slot.value)) {
          slot.value = value;
          isDirty = true;
        }
      };
      return [slot.value, slot.set];
    },
    useRef(initial) {
      return slotAt(cursor++, () => ({ current: initial }));
    },
    useCallback(callback, deps) {
      const slot = slotAt(cursor++, () => ({
        deps: undefined,
        value: undefined,
        set: false,
      }));

      if (!slot.set || !depsEqual(slot.deps, deps)) {
        slot.value = callback;
        slot.deps = deps;
        slot.set = true;
      }

      return slot.value;
    },
    useMemo(factory, deps) {
      const slot = slotAt(cursor++, () => ({
        deps: undefined,
        value: undefined,
        set: false,
      }));

      if (!slot.set || !depsEqual(slot.deps, deps)) {
        slot.value = factory();
        slot.deps = deps;
        slot.set = true;
      }

      return slot.value;
    },
    useEffect(effect, deps) {
      const slot = slotAt(cursor++, () => ({
        deps: undefined,
        cleanup: undefined,
        set: false,
      }));

      if (!slot.set || !depsEqual(slot.deps, deps)) {
        slot.deps = deps;
        slot.set = true;
        slot.effect = effect;
        pendingEffects.push(slot);
      }
    },
  };

  return {
    runtime,
    beginRender() {
      cursor = 0;
      pendingEffects = [];
      isDirty = false;
    },
    runEffects() {
      const queued = pendingEffects;
      pendingEffects = [];
      queued.forEach((slot) => {
        if (typeof slot.cleanup === 'function') {
          slot.cleanup();
        }

        slot.cleanup = slot.effect();
      });
    },
    isDirty: () => isDirty,
  };
};

// Cada cenário monta um App novo, então o runtime ativo é trocado por baixo do
// módulo `react` que o App capturou no require.
let activeHooks;
stub('react', {
  useState: (...args) => activeHooks.runtime.useState(...args),
  useRef: (...args) => activeHooks.runtime.useRef(...args),
  useCallback: (...args) => activeHooks.runtime.useCallback(...args),
  useMemo: (...args) => activeHooks.runtime.useMemo(...args),
  useEffect: (...args) => activeHooks.runtime.useEffect(...args),
});

const {
  createInitialProgress,
  applyLevelCompletion,
  loadProgress,
  saveProgress,
} = require(projectModule('src/storage/progressStorage.ts'));
const { LIVES_STORAGE_KEY, MAX_LIVES, getLivesState } = require(
  projectModule('src/storage/livesStorage.ts'),
);
const App = require(projectModule('App.tsx')).default;

const findProps = (node, type, predicate = () => true) => {
  if (!node || typeof node !== 'object') {
    return undefined;
  }

  if (Array.isArray(node)) {
    return node.reduce(
      (found, child) => found ?? findProps(child, type, predicate),
      undefined,
    );
  }

  if (node.type === type && predicate(node.props)) {
    return node.props;
  }

  return (node.children || []).reduce(
    (found, child) => found ?? findProps(child, type, predicate),
    undefined,
  );
};

const createAppHarness = () => {
  const hooks = createHookRuntime();
  let tree;

  const render = () => {
    // O tick de 1s do App não interessa aqui e manteria o processo vivo.
    const realSetInterval = globalThis.setInterval;
    globalThis.setInterval = () => 0;
    activeHooks = hooks;

    try {
      hooks.beginRender();
      tree = App();
      hooks.runEffects();
    } finally {
      globalThis.setInterval = realSetInterval;
    }
  };

  const flush = () => {
    let guard = 0;

    while (hooks.isDirty() && guard < 50) {
      guard += 1;
      render();
    }
  };

  const settle = async (durationMs) => {
    const deadline = performance.now() + durationMs;

    while (performance.now() < deadline) {
      await wait(5);
      flush();
    }
  };

  render();

  return {
    flush,
    settle,
    waitFor: async (predicate, timeoutMs = 10000) => {
      const deadline = performance.now() + timeoutMs;
      while (!predicate()) {
        if (performance.now() >= deadline)
          throw new Error('App condition did not settle');
        await settle(5);
      }
    },
    props: (type) => findProps(tree, type),
    recoveryButton: () =>
      findProps(tree, 'PrimaryButton') ??
      findProps(tree, 'Text', (props) => props.accessibilityRole === 'button'),
  };
};

const seedLives = (currentLives) => {
  store.set(
    LIVES_STORAGE_KEY,
    JSON.stringify({
      currentLives,
      maxLives: MAX_LIVES,
      lastLifeTimestamp: Date.now(),
    }),
  );
};

const bootApp = async () => {
  const app = createAppHarness();

  // Splash → mapa, e espera o carregamento inicial do disco.
  app.props('SplashIntroScreen').onFinish();
  app.flush();
  await app.waitFor(() => app.props('MainTabs') && app.props('SettingsModal'));

  return app;
};

test('apagar progresso não é desfeito pela compra pendente e segundo toque é bloqueado', async () => {
  store.clear();
  seedLives(MAX_LIVES);
  await saveProgress({ ...createInitialProgress(), coins: 1000 });

  const app = await bootApp();
  const mapProps = app.props('MainTabs');

  assert.equal(mapProps.progress.coins, 1000);

  mapProps.onOpenShop();
  app.flush();

  // O contrato async da loja guarda a primeira compra e bloqueia o duplo toque.
  const shopProps = app.props('ShopScreen');
  const pendingPurchase = shopProps.onPurchasePowerUp('undo', false);
  app.flush();
  assert.equal(
    await app.props('ShopScreen').onPurchasePowerUp('undo', false),
    false,
  );
  app.flush();

  // Configurações → "Apagar progresso" no meio da gravação em voo.
  mapProps.onResetProgress();
  app.flush();
  await pendingPurchase;
  await app.settle(400);

  // O que vale é o disco: era daqui que o progresso velho ressuscitava no próximo
  // `loadProgress()`, com a UI já mostrando tudo zerado.
  const persisted = await loadProgress();

  assert.equal(persisted.coins, 0);
  assert.deepEqual(persisted.itemCounts, createInitialProgress().itemCounts);
  assert.deepEqual(
    persisted.unlockedLevelIds,
    createInitialProgress().unlockedLevelIds,
  );
});

test('duplo toque no ponto de descanso premia uma vida só', async () => {
  store.clear();
  seedLives(2);

  const seededProgress = [
    'w1-001',
    'w1-002',
    'w1-003',
    'w1-004',
    'w1-005',
  ].reduce(
    (progress, levelId) => applyLevelCompletion(progress, levelId, 3).progress,
    createInitialProgress(),
  );
  await saveProgress(seededProgress);

  const app = await bootApp();
  const mapProps = app.props('MainTabs');

  assert.equal(mapProps.progress.completedLevelIds.includes('w1-005'), true);
  assert.equal(mapProps.livesState.currentLives, 2);

  // Dois toques em "Abrir loja" sem re-render entre eles: as duas invocações
  // fecham sobre o mesmo `progress`.
  const [first, second] = await Promise.all([
    mapProps.onOpenRestCheckpoint('w1-005'),
    mapProps.onOpenRestCheckpoint('w1-005'),
  ]);
  app.flush();
  await app.settle(300);

  assert.deepEqual([first.granted, second.granted].sort(), [false, true]);

  const lives = await getLivesState();
  assert.equal(lives.currentLives, 3);

  const persisted = await loadProgress();
  assert.deepEqual(persisted.collectedRestCheckpointIds, ['w1-005']);
});

test('trocar de tela limpa a semente e o retry do diagnóstico anterior', async () => {
  store.clear();
  const app = await bootApp();
  const logger = require(projectModule('src/utils/log.ts'));
  logger.updateDiagnosticContext({ levelId: 'w1-001', seed: 42, retry: true });

  app.props('MainTabs').onOpenShop();
  app.flush();

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    logger.log('warn', 'test', 'after-navigation');
    const context = logger.getDiagnosticEntries().at(-1).context;
    assert.equal(context.screen, 'shop');
    assert.equal(context.levelId, undefined);
    assert.equal(context.seed, undefined);
    assert.equal(context.retry, undefined);
  } finally {
    console.warn = originalWarn;
  }
});

test('modo dev libera navegação apenas em memória e é reversível sem alterar save', async () => {
  store.clear();
  globalThis.__DEV__ = true;
  try {
    const app = await bootApp();
    const before = new Map(store);
    app.props('SettingsModal').onUnlockAllForDevMode();
    app.flush();
    assert.equal(app.props('MainTabs').devMode, true);
    await app.settle(60);
    assert.deepEqual(store, before);
    app.props('SettingsModal').onUnlockAllForDevMode();
    app.flush();
    assert.equal(app.props('MainTabs').devMode, false);
    assert.deepEqual(store, before);
  } finally {
    globalThis.__DEV__ = false;
  }
});

test('capítulos bloqueados não abrem antes de concluir campanha e preservam save legado', async () => {
  store.clear();
  const app = await bootApp();
  const before = new Map(store);
  app.props('MainTabs').onOpenChapters();
  app.flush();
  assert.equal(app.props('ChaptersScreen'), undefined);
  assert.deepEqual(store, before);
});

const chestLevelIds = require(projectModule('src/data/levels.ts'))
  .LEVELS.filter((level) => level.worldId === 1 || level.worldId === 21)
  .map((level) => level.id);
const chestProgress = {
  completedLevelIds: chestLevelIds,
  levelStars: Object.fromEntries(chestLevelIds.map((id) => [id, 3])),
};

test('controlador de baú preserva a guarda de duplo toque e a recompensa após remontar', async () => {
  store.clear();
  seedLives(MAX_LIVES - 1);
  const initial = {
    ...createInitialProgress(),
    coins: 100,
    keys: 2,
    pendingWorldChestIds: ['bonus-world-21'],
    ...chestProgress,
  };
  await saveProgress(initial);
  const app = await bootApp();
  app.props('MainTabs').onOpenWorldChest('bonus-world-21');
  app.flush();
  const modal = app.props('WorldChestModal');
  modal.onOpenWithKey();
  modal.onOpenWithKey();
  await app.waitFor(
    () => app.props('WorldChestModal').result?.status === 'opened',
  );
  const persisted = await loadProgress();
  assert.equal(persisted.keys, 1);
  assert.deepEqual(persisted.claimedWorldChestIds, ['bonus-world-21']);
  assert.deepEqual(persisted.pendingWorldChestIds, []);
  for (const power of ['hint', 'shuffle', 'undo'])
    assert.equal(persisted.itemCounts[power], initial.itemCounts[power] + 1);
  assert.equal((await getLivesState()).currentLives, MAX_LIVES);
  const afterReward = await loadProgress();
  app.props('WorldChestModal').onOpenWithKey();
  await app.settle(100);
  assert.equal(app.props('WorldChestModal').result.status, 'already-opened');
  assert.deepEqual(await loadProgress(), afterReward);
  assert.equal((await getLivesState()).currentLives, MAX_LIVES);
  const reopened = await bootApp();
  assert.deepEqual(reopened.props('MainTabs').progress, persisted);
});

test('controlador de baú mantém saldo e chave quando a abertura não pode premiar', async () => {
  store.clear();
  await saveProgress({
    ...createInitialProgress(),
    coins: 0,
    keys: 0,
    pendingWorldChestIds: ['bonus-world-21'],
    ...chestProgress,
  });
  const app = await bootApp();
  app.props('MainTabs').onOpenWorldChest('bonus-world-21');
  app.flush();
  const before = await loadProgress();
  app.props('WorldChestModal').onBuyAndOpen();
  await app.waitFor(
    () => app.props('WorldChestModal').result?.status === 'insufficient-coins',
  );
  assert.deepEqual(await loadProgress(), before);
  assert.equal(app.props('WorldChestModal').isOpening, false);
  app.props('WorldChestModal').onClose();
  app.flush();
  assert.equal(app.props('WorldChestModal').visible, false);
});

const CAMPAIGN_KEY = '@trinca-mania/progress-v2';
const CHAPTER_KEY = '@trinca-mania/chapter-progress-v1';
const FIRST_MAP = require(projectModule('src/data/chapters.ts'))
  .CHAPTER_LEVELS[0].id;

const bootChapterGame = async () => {
  globalThis.__DEV__ = true;
  const app = await bootApp();
  app.props('SettingsModal').onUnlockAllForDevMode();
  app.flush();
  app.props('MainTabs').onOpenChapters();
  app.flush();
  await app.props('ChaptersScreen').onSelectChapterLevel(FIRST_MAP);
  app.flush();
  globalThis.__DEV__ = false;
  return app;
};

test('recompensa de capítulo recupera carteira após falha entre estrela e moeda', async () => {
  store.clear();
  const app = await bootChapterGame();
  interceptWrite = async (key) => {
    if (key === CAMPAIGN_KEY) throw new Error('injected wallet failure');
  };
  try {
    await assert.rejects(
      app.props('GameScreen').onLevelComplete(FIRST_MAP, 1),
      /injected wallet failure/,
    );
  } finally {
    interceptWrite = undefined;
  }
  assert.equal(store.has(CHAPTER_KEY), false);
  assert.equal(
    JSON.parse(store.get('@trinca-mania/chapter-transaction-v1')).kind,
    'completion',
  );
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 10);
  const again = await bootApp();
  assert.equal(again.props('MainTabs').progress.coins, 10);
});

test('recompensa de capítulo repete write falho na mesma sessão sem duplicar', async () => {
  store.clear();
  const app = await bootChapterGame();
  const complete = app.props('GameScreen').onLevelComplete;
  interceptWrite = async (key) => {
    if (key === CAMPAIGN_KEY) throw new Error('wallet unavailable');
  };
  try {
    await assert.rejects(complete(FIRST_MAP, 1), /wallet unavailable/);
  } finally {
    interceptWrite = undefined;
  }
  await complete(FIRST_MAP, 1);
  assert.equal((await loadProgress()).coins, 10);
  await complete(FIRST_MAP, 3);
  await complete(FIRST_MAP, 3);
  await complete(FIRST_MAP, 1);
  assert.equal((await loadProgress()).coins, 35);
  assert.equal(JSON.parse(store.get(CHAPTER_KEY)).mapStars[FIRST_MAP], 3);
});

test('recompensa de capítulo recupera falha no write de estrelas sem perder a pendência em memória', async () => {
  store.clear();
  const app = await bootChapterGame();
  const complete = app.props('GameScreen').onLevelComplete;
  interceptWrite = async (key) => {
    if (key === CHAPTER_KEY) throw new Error('chapter unavailable');
  };
  try {
    await assert.rejects(complete(FIRST_MAP, 1), /chapter unavailable/);
  } finally {
    interceptWrite = undefined;
  }
  assert.equal(store.has(CHAPTER_KEY), false);
  assert.equal((await loadProgress()).coins, 10);
  assert.equal(
    JSON.parse(store.get('@trinca-mania/chapter-transaction-v1')).kind,
    'completion',
  );
  await complete(FIRST_MAP, 1);
  assert.equal((await loadProgress()).coins, 10);
  assert.equal(JSON.parse(store.get(CHAPTER_KEY)).mapStars[FIRST_MAP], 1);
});

test('recompensa de capítulo é idempotente se storage gravou mas rejeitou confirmação', async () => {
  store.clear();
  const app = await bootChapterGame();
  interceptWrite = async (key, value) => {
    if (key === CAMPAIGN_KEY) {
      store.set(key, value);
      throw new Error('ack lost');
    }
  };
  try {
    await assert.rejects(
      app.props('GameScreen').onLevelComplete(FIRST_MAP, 3),
      /ack lost/,
    );
  } finally {
    interceptWrite = undefined;
  }
  assert.equal((await loadProgress()).coins, 35);
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 35);
});

test('recompensa de capítulo serializa duplo toque e não repõe moedas gastas', async () => {
  store.clear();
  const app = await bootChapterGame();
  const complete = app.props('GameScreen').onLevelComplete;
  const results = await Promise.all([
    complete(FIRST_MAP, 3),
    complete(FIRST_MAP, 3),
  ]);
  assert.deepEqual(
    results.map((result) => result.coinsEarned),
    [35, 0],
  );
  const paid = await loadProgress();
  assert.equal(paid.coins, 35);
  // Fixture durável de uma compra posterior: recibo acompanha o saldo restante.
  await saveProgress({ ...paid, coins: 4 });
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 4);
});

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

test('reset invalida conclusão de capítulo em voo e conclusão ainda enfileirada', async () => {
  store.clear();
  const app = await bootChapterGame();
  const started = deferred();
  const release = deferred();
  let blocked = false;
  interceptWrite = async (key) => {
    if (key === CHAPTER_KEY && !blocked) {
      blocked = true;
      started.resolve();
      await release.promise;
    }
  };
  const complete = app.props('GameScreen').onLevelComplete;
  const first = assert.rejects(complete(FIRST_MAP, 1), /superseded/);
  const queued = assert.rejects(complete(FIRST_MAP, 3), /superseded/);
  try {
    await started.promise;
    app.props('SettingsModal').onResetProgress();
    app.flush();
    release.resolve();
    await Promise.all([first, queued]);
    await app.waitFor(() => app.props('SettingsModal'));
  } finally {
    release.resolve();
    interceptWrite = undefined;
  }
  assert.equal((await loadProgress()).coins, 0);
  assert.deepEqual(JSON.parse(store.get(CHAPTER_KEY)).mapStars, {});
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 0);
});

test('reset interrompido após carteira não ressuscita estrelas nem recompensa no boot', async () => {
  store.clear();
  const app = await bootChapterGame();
  await app.props('GameScreen').onLevelComplete(FIRST_MAP, 3);
  app.flush();
  const failed = deferred();
  interceptWrite = async (key) => {
    if (key === CHAPTER_KEY) {
      failed.resolve();
      throw new Error('reset chapter failed');
    }
  };
  app.props('SettingsModal').onResetProgress();
  app.flush();
  await failed.promise;
  await app.settle(30);
  interceptWrite = undefined;
  assert.equal((await loadProgress()).coins, 0);
  assert.equal(JSON.parse(store.get(CHAPTER_KEY)).mapStars[FIRST_MAP], 3);
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 0);
  assert.deepEqual(JSON.parse(store.get(CHAPTER_KEY)).mapStars, {});
});

test('reset cuja carteira falha preserva capítulos duráveis e permite nova tentativa', async () => {
  store.clear();
  const app = await bootChapterGame();
  await app.props('GameScreen').onLevelComplete(FIRST_MAP, 3);
  app.flush();
  const before = store.get(CHAPTER_KEY);
  const failed = deferred();
  interceptWrite = async (key) => {
    if (key === CAMPAIGN_KEY) {
      failed.resolve();
      throw new Error('reset wallet failed');
    }
  };
  const reset = app.props('SettingsModal').onResetProgress;
  reset();
  app.flush();
  await failed.promise;
  await app.settle(30);
  interceptWrite = undefined;
  assert.equal(store.get(CHAPTER_KEY), before);
  assert.equal((await loadProgress()).coins, 35);
  app.recoveryButton().onPress();
  app.flush();
  await app.waitFor(() => app.props('SettingsModal'));
  assert.equal((await loadProgress()).coins, 0);
  assert.deepEqual(JSON.parse(store.get(CHAPTER_KEY)).mapStars, {});
  assert.equal(JSON.parse(store.get(CAMPAIGN_KEY)).chapterRewards.epoch, 1);
});

test('save legado de capítulo não recebe pagamento retroativo; melhora recebe só diferença', async () => {
  store.clear();
  store.set(CHAPTER_KEY, JSON.stringify({ mapStars: { [FIRST_MAP]: 1 } }));
  await saveProgress({ ...createInitialProgress(), coins: 7 });
  const app = await bootChapterGame();
  assert.equal((await loadProgress()).coins, 7);
  await app.props('GameScreen').onLevelComplete(FIRST_MAP, 3);
  assert.equal((await loadProgress()).coins, 32);
  const reopened = await bootApp();
  assert.equal(reopened.props('MainTabs').progress.coins, 32);
});

test('ledger inválido não libera o jogo nem sobrescreve os dados', async () => {
  store.clear();
  const invalid = {
    ...createInitialProgress(),
    chapterRewards: { epoch: 0, total: -1 },
  };
  store.set(CAMPAIGN_KEY, JSON.stringify(invalid));
  await assert.rejects(loadProgress(), /Invalid chapter reward ledger/);
  const app = createAppHarness();
  app.props('SplashIntroScreen').onFinish();
  app.flush();
  await app.settle(120);
  assert.equal(app.props('MainTabs'), undefined);
  assert.deepEqual(JSON.parse(store.get(CAMPAIGN_KEY)), invalid);
});

test('callback antigo após reset e duplo reset não premiam na geração nova', async () => {
  store.clear();
  const app = await bootChapterGame();
  const complete = app.props('GameScreen').onLevelComplete;
  await complete(FIRST_MAP, 1);
  app.flush();
  const reset = app.props('SettingsModal').onResetProgress;
  reset();
  reset();
  app.flush();
  await app.waitFor(() => app.props('SettingsModal'));
  await assert.rejects(complete(FIRST_MAP, 3), /superseded/);
  assert.equal((await loadProgress()).coins, 0);
  assert.equal(JSON.parse(store.get(CAMPAIGN_KEY)).chapterRewards.epoch, 1);
  assert.deepEqual(JSON.parse(store.get(CHAPTER_KEY)).mapStars, {});
});

test('recuperação de capítulo rejeita recibo maior ou época futura sem sobrescrever saves', async () => {
  for (const chapterRewards of [
    { epoch: 0, total: 5 },
    { epoch: 2, total: 10 },
  ]) {
    store.clear();
    store.set(
      CAMPAIGN_KEY,
      JSON.stringify({
        ...createInitialProgress(),
        chapterRewards: { epoch: 0, total: 10 },
      }),
    );
    store.set(
      CHAPTER_KEY,
      JSON.stringify({ mapStars: { [FIRST_MAP]: 1 }, chapterRewards }),
    );
    const before = [store.get(CAMPAIGN_KEY), store.get(CHAPTER_KEY)];
    const app = createAppHarness();
    app.props('SplashIntroScreen').onFinish();
    app.flush();
    await app.settle(120);
    assert.equal(app.props('MainTabs'), undefined);
    assert.deepEqual([store.get(CAMPAIGN_KEY), store.get(CHAPTER_KEY)], before);
  }
});

test('recuperação no boot mantém jogo bloqueado até retry persistir a carteira', async () => {
  store.clear();
  store.set(
    CHAPTER_KEY,
    JSON.stringify({
      mapStars: { [FIRST_MAP]: 1 },
      chapterRewards: { epoch: 0, total: 10 },
    }),
  );
  const failed = deferred();
  interceptWrite = async (key) => {
    if (key === CAMPAIGN_KEY) {
      failed.resolve();
      throw new Error('recovery wallet failed');
    }
  };
  const app = createAppHarness();
  app.props('SplashIntroScreen').onFinish();
  app.flush();
  try {
    await failed.promise;
    await app.waitFor(() => app.recoveryButton());
    assert.equal(app.props('MainTabs'), undefined);
    assert.equal(store.has(CAMPAIGN_KEY), false);
  } finally {
    interceptWrite = undefined;
  }
  app.recoveryButton().onPress();
  app.flush();
  await app.waitFor(() => app.props('MainTabs'));
  assert.equal((await loadProgress()).coins, 10);
  assert.equal(app.props('MainTabs').progress.coins, 10);
});

test('ambos storages rejeitam ledger inválido na leitura e escrita sem apagar progresso', async () => {
  const {
    loadChapterProgress,
    saveChapterProgress,
  } = require('../src/storage/chapterProgressStorage.ts');
  for (const ledger of [
    null,
    { epoch: -1, total: 10 },
    { epoch: 0, total: '10' },
  ]) {
    store.clear();
    const wallet = {
      ...createInitialProgress(),
      coins: 47,
      chapterRewards: ledger,
    };
    const chapter = { mapStars: { [FIRST_MAP]: 3 }, chapterRewards: ledger };
    const walletRaw = JSON.stringify(wallet);
    const chapterRaw = JSON.stringify(chapter);
    store.set(CAMPAIGN_KEY, walletRaw);
    store.set(CHAPTER_KEY, chapterRaw);
    await assert.rejects(loadProgress(), /Invalid chapter reward ledger/);
    await assert.rejects(
      loadChapterProgress(),
      /Invalid chapter reward ledger/,
    );
    await assert.rejects(saveProgress(wallet), /Invalid chapter reward ledger/);
    await assert.rejects(
      saveChapterProgress(chapter),
      /Invalid chapter reward ledger/,
    );
    assert.equal(store.get(CAMPAIGN_KEY), walletRaw);
    assert.equal(store.get(CHAPTER_KEY), chapterRaw);
    const app = createAppHarness();
    app.props('SplashIntroScreen').onFinish();
    app.flush();
    await app.settle(120);
    assert.equal(app.props('MainTabs'), undefined);
    assert.equal(store.get(CAMPAIGN_KEY), walletRaw);
    assert.equal(store.get(CHAPTER_KEY), chapterRaw);
  }
});
