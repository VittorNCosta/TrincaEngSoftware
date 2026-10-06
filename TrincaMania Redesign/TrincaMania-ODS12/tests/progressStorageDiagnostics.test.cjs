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

let stored;
let writes = 0;
const storagePath =
  require.resolve('@react-native-async-storage/async-storage');
require.cache[storagePath] = {
  id: storagePath,
  filename: storagePath,
  loaded: true,
  exports: {
    __esModule: true,
    default: {
      getItem: async () => stored,
      setItem: async (_key, value) => {
        stored = value;
        writes++;
      },
    },
  },
};
const {
  createInitialProgress,
  loadProgress,
  saveProgress,
  normalizeProgress,
} = require('../src/storage/progressStorage.ts');
const { getDiagnosticEntries } = require('../src/utils/log.ts');
const chapterId = 'ch01-001';
const fields = [
  'completedLevelIds',
  'unlockedLevelIds',
  'chestProgressLevelIds',
  'collectedRestCheckpointIds',
  'levelStars',
];
const diagnostics = () =>
  getDiagnosticEntries().filter(
    (entry) => entry.message === 'campaign-storage-rejects-chapter-ids',
  );
const corruptProgress = (field) => ({
  ...createInitialProgress(),
  coins: 75,
  keys: 2,
  [field]: field === 'levelStars' ? { [chapterId]: 3 } : [chapterId],
});

for (const field of fields) {
  test(`load diagnoses chapter ids in ${field} before filtering, without writing the save`, async () => {
    const raw = corruptProgress(field);
    stored = JSON.stringify(raw);
    writes = 0;
    const before = diagnostics().length;
    const result = await loadProgress();
    assert.deepEqual(result, normalizeProgress(raw));
    assert.equal(result.coins, 75);
    assert.equal(result.keys, 2);
    assert.equal(stored, JSON.stringify(raw));
    assert.equal(writes, 0);
    assert.equal(diagnostics().length, before + 1);
    assert.equal(diagnostics().at(-1).detail, undefined);
  });
  test(`save diagnoses chapter ids in ${field} before writing the existing normalized result`, async () => {
    const raw = corruptProgress(field);
    const snapshot = JSON.stringify(raw);
    writes = 0;
    const before = diagnostics().length;
    await saveProgress(raw);
    assert.equal(stored, JSON.stringify(normalizeProgress(raw)));
    assert.equal(writes, 1);
    assert.equal(JSON.stringify(raw), snapshot);
    assert.equal(diagnostics().length, before + 1);
  });
}

test('normalization stays pure and valid or malformed ids do not cause spurious chapter diagnostics', async () => {
  const raw = corruptProgress('completedLevelIds');
  const snapshot = JSON.stringify(raw);
  const before = diagnostics().length;
  normalizeProgress(raw);
  assert.equal(JSON.stringify(raw), snapshot);
  assert.equal(diagnostics().length, before);
  for (const value of [
    null,
    42,
    [],
    { levelStars: [] },
    { levelStars: 17, unlockedLevelIds: 'ch01-001' },
    { completedLevelIds: [null, 17, {}, 'w1-001'] },
    createInitialProgress(),
  ]) {
    stored = JSON.stringify(value);
    await assert.doesNotReject(() => loadProgress());
  }
  assert.equal(diagnostics().length, before);
});

const {
  loadChapterProgress,
  saveChapterProgress,
  normalizeChapterProgress,
} = require('../src/storage/chapterProgressStorage.ts');
const chapterDiagnostics = () =>
  getDiagnosticEntries().filter(
    (entry) => entry.message === 'chapter-storage-rejects-campaign-ids',
  );

test('chapter storage diagnoses campaign ids before normalization on read and write, preserving valid chapter progress', async () => {
  const raw = { mapStars: { 'ch01-001': 2, 'w1-001': 3, 'bonus-w1-001': 3 } };
  const snapshot = JSON.stringify(raw);
  stored = snapshot;
  writes = 0;
  const before = chapterDiagnostics().length;
  const result = await loadChapterProgress();
  assert.deepEqual(result, { mapStars: { 'ch01-001': 2 } });
  assert.equal(stored, snapshot);
  assert.equal(writes, 0);
  assert.equal(chapterDiagnostics().length, before + 1);
  await saveChapterProgress(raw, 'commitChapterProgress');
  assert.equal(writes, 1);
  assert.equal(stored, JSON.stringify(normalizeChapterProgress(raw)));
  assert.equal(JSON.stringify(raw), snapshot);
  assert.equal(chapterDiagnostics().length, before + 2);
  assert.equal(chapterDiagnostics().at(-1).detail, undefined);
});

test('valid and malformed chapter saves remain accepted without spurious domain diagnostics', async () => {
  const before = chapterDiagnostics().length;
  for (const raw of [
    null,
    17,
    [],
    { mapStars: [] },
    { mapStars: 17 },
    { mapStars: { 'ch01-001': 3 } },
  ]) {
    stored = JSON.stringify(raw);
    await assert.doesNotReject(() => loadChapterProgress());
  }
  assert.equal(chapterDiagnostics().length, before);
});
