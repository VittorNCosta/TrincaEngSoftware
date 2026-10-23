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
  createChapterCompletionTransactions,
  CHAPTER_TRANSACTION_KEY,
} = require('../src/storage/chapterCompletionTransaction.ts');
const {
  createInitialProgress,
  normalizeProgress,
  grantRewardForOperation,
} = require('../src/storage/progressStorage.ts');
const {
  createInitialChapterProgress,
  normalizeChapterProgress,
  isChapterMapUnlocked,
} = require('../src/storage/chapterProgressStorage.ts');
const {
  getIncrementalCoinRewardForLevel,
} = require('../src/domain/recycling/services/ScoringService.ts');
const { CHAPTER_LEVELS } = require('../src/data/chapters.ts');
const first = CHAPTER_LEVELS[0].id;
const reward = (stars) => getIncrementalCoinRewardForLevel(0, stars);
const clone = (value) => JSON.parse(JSON.stringify(value));
function harness(disk = new Map(), fault = {}) {
  let generation = 0;
  let writes = 0;
  let current = {
    progress: createInitialProgress(),
    chapterProgress: createInitialChapterProgress(),
  };
  const write = async (key, value) => {
    writes++;
    if (fault.beforeWrite) await fault.beforeWrite(writes, key);
    if (fault.at === writes && !fault.after)
      throw Error('injected write failure');
    disk.set(key, value);
    if (fault.at === writes && fault.after)
      throw Error('injected acknowledgement failure');
  };
  const api = createChapterCompletionTransactions({
    storage: { getItem: async (key) => disk.get(key) ?? null, setItem: write },
    current: () => current,
    load: async () => ({
      progress: normalizeProgress(
        JSON.parse(disk.get('wallet') ?? 'null') ?? createInitialProgress(),
      ),
      chapterProgress: normalizeChapterProgress(
        JSON.parse(disk.get('chapter') ?? 'null') ?? undefined,
      ),
    }),
    restore: (snapshot) => {
      current = snapshot;
    },
    commitProgress: async (progress) => {
      current.progress = progress;
      await write('wallet', JSON.stringify(normalizeProgress(progress)));
    },
    commitChapterProgress: async (progress) => {
      current.chapterProgress = progress;
      await write(
        'chapter',
        JSON.stringify(normalizeChapterProgress(progress)),
      );
    },
    generation: () => generation,
    invalidate: () => generation++,
    resetOtherDomains: async () => {
      if (fault.resetOtherDomains) await fault.resetOtherDomains(disk);
    },
  });
  return { ...api, disk, current: () => clone(current), fault };
}

for (const after of [false, true])
  for (const at of [1, 2, 3, 4])
    for (const reload of [false, true]) {
      test(`completion failure write=${at} after=${after} reload=${reload}: retry pays exactly once`, async () => {
        let h = harness(new Map(), { at, after });
        const initial = h.current().progress.coins;
        await assert.rejects(h.commitChapterCompletion(first, 3), /injected/);
        if (reload) {
          h = harness(h.disk);
          await h.recoverProgress();
        } else h.fault.at = undefined;
        await h.commitChapterCompletion(first, 3);
        await h.commitChapterCompletion(first, 3);
        const reboot = harness(h.disk);
        await reboot.recoverProgress();
        assert.equal(reboot.current().progress.coins, initial + reward(3));
        assert.equal(reboot.current().chapterProgress.mapStars[first], 3);
        assert.equal(h.disk.get(CHAPTER_TRANSACTION_KEY), 'null');
        assert.deepEqual(reboot.current().progress.levelStars, {});
      });
    }

test('parallel completions and star improvements serialize without lost coins or duplicate rewards', async () => {
  const h = harness();
  const initial = h.current().progress.coins;
  await Promise.all(
    [1, 3, 2, 3, 1].map((stars) => h.commitChapterCompletion(first, stars)),
  );
  await Promise.all(
    CHAPTER_LEVELS.slice(1, 11).map((map) =>
      h.commitChapterCompletion(map.id, 3),
    ),
  );
  assert.equal(h.current().progress.coins, initial + 11 * reward(3));
  assert.equal(Object.keys(h.current().chapterProgress.mapStars).length, 11);
});

test('recovery preserves unrelated campaign state and receipts survive more than 512 other operations', async () => {
  const h = harness(new Map(), { at: 3 });
  await assert.rejects(h.commitChapterCompletion(first, 3));
  let wallet = JSON.parse(h.disk.get('wallet'));
  for (let i = 0; i < 600; i++)
    wallet = grantRewardForOperation(wallet, `other:${i}`, { coins: 1 });
  wallet.levelStars['w1-001'] = 2;
  h.disk.set('wallet', JSON.stringify(wallet));
  const reboot = harness(h.disk);
  await reboot.recoverProgress();
  assert.equal(
    reboot.current().progress.coins,
    createInitialProgress().coins + reward(3) + 600,
  );
  assert.equal(reboot.current().progress.levelStars['w1-001'], 2);
});

for (const after of [false, true])
  for (const at of [1, 2, 3, 4]) {
    test(`reset failure write=${at} after=${after}: retry and reload leave both saves empty`, async () => {
      const seed = harness();
      await seed.commitChapterCompletion(first, 3);
      let h = harness(seed.disk, { at, after });
      await assert.rejects(h.resetProgress());
      h = harness(h.disk);
      await h.recoverProgress();
      // Before intent is persisted the reset is not accepted; explicit retry is required.
      if (at === 1 && !after) await h.resetProgress();
      assert.deepEqual(h.current(), {
        progress: createInitialProgress(),
        chapterProgress: createInitialChapterProgress(),
      });
      await h.commitChapterCompletion(first, 3);
      assert.equal(
        h.current().progress.coins,
        createInitialProgress().coins + reward(3),
      );
    });
  }

test('reset during in-flight write invalidates current and queued completions', async () => {
  let release;
  let entered;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  const h = harness(new Map(), {
    beforeWrite: async (n) => {
      if (n === 2) {
        entered();
        await hold;
      }
    },
  });
  const completion = h.commitChapterCompletion(first, 3);
  const completionCheck = assert.rejects(completion, /cancelada/);
  const queued = h.commitChapterCompletion(CHAPTER_LEVELS[1].id, 3);
  const queuedCheck = assert.rejects(queued, /cancelada/);
  await started;
  const reset = h.resetProgress();
  release();
  await Promise.all([completionCheck, queuedCheck, reset]);
  const reboot = harness(h.disk);
  await reboot.recoverProgress();
  assert.deepEqual(reboot.current(), {
    progress: createInitialProgress(),
    chapterProgress: createInitialChapterProgress(),
  });
});

test('every chapter boundary and final map survive journal recovery', async () => {
  for (let index = 99; index < 1000; index += 100) {
    const mapId = CHAPTER_LEVELS[index].id;
    const h = harness(new Map(), { at: 3 });
    await assert.rejects(h.commitChapterCompletion(mapId, 3));
    const reboot = harness(h.disk);
    await reboot.recoverProgress();
    assert.equal(reboot.current().chapterProgress.mapStars[mapId], 3);
    if (index < 999)
      assert.equal(
        isChapterMapUnlocked(
          CHAPTER_LEVELS[index + 1].id,
          reboot.current().chapterProgress,
        ),
        true,
      );
    assert.equal(
      reboot.current().progress.coins,
      createInitialProgress().coins + reward(3),
    );
  }
});

test('unknown maps, nonfinite stars and corrupt journal fail before changing saves', async () => {
  const h = harness();
  await assert.rejects(h.commitChapterCompletion('w1-001', 3), /inválida/);
  await assert.rejects(h.commitChapterCompletion(first, NaN), /inválida/);
  assert.equal(h.disk.size, 0);
  h.disk.set(CHAPTER_TRANSACTION_KEY, '{broken');
  await assert.rejects(h.recoverProgress());
  assert.equal(h.disk.size, 1);
});

test('distinct storage adapters isolate visitor/test/native transaction state', async () => {
  const a = harness(new Map(), { at: 3 });
  await assert.rejects(a.commitChapterCompletion(first, 3));
  const b = harness();
  await b.recoverProgress();
  assert.deepEqual(b.current().chapterProgress.mapStars, {});
  assert.equal(b.current().progress.coins, createInitialProgress().coins);
});

for (const boundary of Array.from({ length: 9 }, (_, index) => index)) {
  for (const after of [false, true]) {
    test(`ancillary reset failure domain=${boundary} after=${after} survives reload`, async () => {
      const disk = new Map(
        Array.from({ length: 9 }, (_, index) => [`extra${index}`, 'old']),
      );
      const resetExtras = async (store, fail) => {
        const results = await Promise.allSettled(
          Array.from({ length: 9 }, async (_, index) => {
            if (index === fail && !after) throw Error('extra reset failed');
            store.set(`extra${index}`, 'empty');
            if (index === fail && after) throw Error('extra reset failed');
          }),
        );
        const failure = results.find((result) => result.status === 'rejected');
        if (failure) throw failure.reason;
      };
      const h = harness(disk, {
        resetOtherDomains: (store) => resetExtras(store, boundary),
      });
      await h.commitChapterCompletion(first, 3);
      await assert.rejects(h.resetProgress(), /extra reset failed/);
      assert.equal(JSON.parse(disk.get(CHAPTER_TRANSACTION_KEY)).kind, 'reset');
      const reboot = harness(disk, {
        resetOtherDomains: (store) => resetExtras(store),
      });
      await reboot.recoverProgress();
      assert.equal(disk.get(CHAPTER_TRANSACTION_KEY), 'null');
      for (let index = 0; index < 9; index++)
        assert.equal(disk.get(`extra${index}`), 'empty');
      assert.equal(
        reboot.current().progress.coins,
        createInitialProgress().coins,
      );
    });
  }
}
