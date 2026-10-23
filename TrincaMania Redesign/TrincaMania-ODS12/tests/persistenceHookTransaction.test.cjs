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
const disk = new Map();
let holdChapter;
const storage = {
  getItem: async (key) => disk.get(key) ?? null,
  setItem: async (key, value) => {
    if (holdChapter && key === '@trinca-mania/chapter-progress-v1')
      await holdChapter;
    disk.set(key, value);
  },
};
const stub = (name, exports) => {
  const filename = require.resolve(name);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
stub('@react-native-async-storage/async-storage', {
  __esModule: true,
  default: storage,
});
stub('react', { useCallback: (fn) => fn, useMemo: (fn) => fn() });
const {
  useProgressPersistence,
} = require('../src/hooks/useProgressPersistence.ts');
const {
  createInitialProgress,
  loadProgress,
} = require('../src/storage/progressStorage.ts');
const {
  createInitialChapterProgress,
  loadChapterProgress,
} = require('../src/storage/chapterProgressStorage.ts');
const {
  getIncrementalCoinRewardForLevel,
} = require('../src/domain/recycling/services/ScoringService.ts');
const ref = (current) => ({ current });
const useOwner = () => {
  const progressRef = ref(createInitialProgress());
  const chapterProgressRef = ref(createInitialChapterProgress());
  return {
    progressRef,
    chapterProgressRef,
    ...useProgressPersistence({
      resetOtherDomains: async () => {},
      progressRef,
      chapterProgressRef,
      progressGenerationRef: ref(0),
      progressSaveQueueRef: ref(Promise.resolve()),
      chapterProgressSaveQueueRef: ref(Promise.resolve()),
      setProgress: () => {},
      setChapterProgress: () => {},
    }),
  };
};

test('real storage serializers and hook queue recover failure without losing unrelated wallet mutation', async () => {
  disk.clear();
  const h = useOwner();
  // Match the real key instead of assuming its version.
  await h.commitProgress(h.progressRef.current);
  const walletKey = [...disk.keys()].find((key) => !key.includes('chapter'));
  const originalSet = storage.setItem;
  let once = true;
  storage.setItem = async (key, value) => {
    if (key === walletKey && once) {
      once = false;
      throw Error('wallet failed');
    }
    return originalSet(key, value);
  };
  await assert.rejects(
    h.commitChapterCompletion('ch01-001', 3),
    /wallet failed/,
  );
  storage.setItem = originalSet;
  await h.commitProgress({
    ...h.progressRef.current,
    coins: h.progressRef.current.coins + 17,
  });
  await h.commitChapterCompletion('ch01-001', 3);
  const reboot = useOwner();
  await reboot.recoverProgress();
  assert.equal(
    reboot.progressRef.current.coins,
    createInitialProgress().coins + getIncrementalCoinRewardForLevel(0, 3) + 17,
  );
  assert.equal(reboot.chapterProgressRef.current.mapStars['ch01-001'], 3);
});

test('chapter queue writes from the old generation cannot overwrite reset', async () => {
  disk.clear();
  const h = useOwner();
  let release;
  holdChapter = new Promise((resolve) => {
    release = resolve;
  });
  const first = h.commitChapterProgress({ mapStars: { 'ch01-001': 1 } });
  await new Promise((resolve) => setImmediate(resolve));
  const second = h.commitChapterProgress({ mapStars: { 'ch01-001': 3 } });
  const reset = h.resetProgress();
  release();
  holdChapter = undefined;
  await Promise.all([first, second, reset]);
  assert.deepEqual(await loadChapterProgress(), createInitialChapterProgress());
  assert.deepEqual(await loadProgress(), createInitialProgress());
});
