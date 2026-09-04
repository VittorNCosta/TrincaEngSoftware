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
globalThis.__jsx = (type, props, ...children) => ({ type, props: props || {}, children });
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

stub('@react-native-async-storage/async-storage', {
  __esModule: true,
  default: asyncStorageMock,
});
stub('expo-status-bar', { StatusBar: 'StatusBar' });
stub('react-native', {
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

stub(projectModule('src/components/CampaignResizeNoticeModal'), {
  CampaignResizeNoticeModal: 'CampaignResizeNoticeModal',
});
stub(projectModule('src/components/MysteryTutorialModal'), {
  MysteryTutorialModal: 'MysteryTutorialModal',
});
stub(projectModule('src/components/NoLivesModal'), { NoLivesModal: 'NoLivesModal' });
stub(projectModule('src/components/SettingsModal'), { SettingsModal: 'SettingsModal' });
stub(projectModule('src/components/TutorialModal'), { TutorialModal: 'TutorialModal' });
stub(projectModule('src/components/WorldChestModal'), { WorldChestModal: 'WorldChestModal' });
stub(projectModule('src/navigation/MainTabs'), { MainTabs: 'MainTabs' });
stub(projectModule('src/screens/ChaptersScreen'), { ChaptersScreen: 'ChaptersScreen' });
stub(projectModule('src/screens/GameScreen'), { GameScreen: 'GameScreen' });
stub(projectModule('src/screens/ShopScreen'), { ShopScreen: 'ShopScreen' });
stub(projectModule('src/screens/SplashIntroScreen'), { SplashIntroScreen: 'SplashIntroScreen' });
stub(projectModule('src/utils/sounds'), { setSoundEnabled: async () => undefined });

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

      return [
        slot.value,
        (next) => {
          const value = typeof next === 'function' ? next(slot.value) : next;

          if (!Object.is(value, slot.value)) {
            slot.value = value;
            isDirty = true;
          }
        },
      ];
    },
    useRef(initial) {
      return slotAt(cursor++, () => ({ current: initial }));
    },
    useCallback(callback, deps) {
      const slot = slotAt(cursor++, () => ({ deps: undefined, value: undefined, set: false }));

      if (!slot.set || !depsEqual(slot.deps, deps)) {
        slot.value = callback;
        slot.deps = deps;
        slot.set = true;
      }

      return slot.value;
    },
    useMemo(factory, deps) {
      const slot = slotAt(cursor++, () => ({ deps: undefined, value: undefined, set: false }));

      if (!slot.set || !depsEqual(slot.deps, deps)) {
        slot.value = factory();
        slot.deps = deps;
        slot.set = true;
      }

      return slot.value;
    },
    useEffect(effect, deps) {
      const slot = slotAt(cursor++, () => ({ deps: undefined, cleanup: undefined, set: false }));

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

const { createInitialProgress, applyLevelCompletion, loadProgress, saveProgress } = require(
  projectModule('src/storage/progressStorage.ts'),
);
const { LIVES_STORAGE_KEY, MAX_LIVES, getLivesState } = require(
  projectModule('src/storage/livesStorage.ts'),
);
const App = require(projectModule('App.tsx')).default;

const findProps = (node, type) => {
  if (!node || typeof node !== 'object') {
    return undefined;
  }

  if (Array.isArray(node)) {
    return node.reduce((found, child) => found ?? findProps(child, type), undefined);
  }

  if (node.type === type) {
    return node.props;
  }

  return (node.children || []).reduce((found, child) => found ?? findProps(child, type), undefined);
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
    const deadline = Date.now() + durationMs;

    while (Date.now() < deadline) {
      await wait(5);
      flush();
    }
  };

  render();

  return {
    flush,
    settle,
    props: (type) => findProps(tree, type),
  };
};

const seedLives = (currentLives) => {
  store.set(
    LIVES_STORAGE_KEY,
    JSON.stringify({ currentLives, maxLives: MAX_LIVES, lastLifeTimestamp: Date.now() }),
  );
};

const bootApp = async () => {
  const app = createAppHarness();

  // Splash → mapa, e espera o carregamento inicial do disco.
  app.props('SplashIntroScreen').onFinish();
  app.flush();
  await app.settle(200);

  return app;
};

test('apagar progresso não é desfeito pelas compras que ainda estavam na fila', async () => {
  store.clear();
  seedLives(MAX_LIVES);
  await saveProgress({ ...createInitialProgress(), coins: 1000 });

  const app = await bootApp();
  const mapProps = app.props('MainTabs');

  assert.equal(mapProps.progress.coins, 1000);

  mapProps.onOpenShop();
  app.flush();

  // Duas compras em rajada: a primeira grava, a segunda fica enfileirada.
  const shopProps = app.props('ShopScreen');
  assert.equal(shopProps.onBuyItem('undo'), true);
  app.flush();
  assert.equal(app.props('ShopScreen').onBuyItem('undo'), true);
  app.flush();

  // Configurações → "Apagar progresso" no meio das gravações em voo.
  mapProps.onResetProgress();
  app.flush();

  await app.settle(400);

  // O que vale é o disco: era daqui que o progresso velho ressuscitava no próximo
  // `loadProgress()`, com a UI já mostrando tudo zerado.
  const persisted = await loadProgress();

  assert.equal(persisted.coins, 0);
  assert.deepEqual(persisted.itemCounts, createInitialProgress().itemCounts);
  assert.deepEqual(persisted.unlockedLevelIds, createInitialProgress().unlockedLevelIds);
});

test('duplo toque no ponto de descanso premia uma vida só', async () => {
  store.clear();
  seedLives(2);

  const seededProgress = ['w1-001', 'w1-002', 'w1-003', 'w1-004', 'w1-005'].reduce(
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
