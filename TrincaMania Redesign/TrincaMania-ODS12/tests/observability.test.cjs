const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
const logger = require('../src/utils/log.ts');
const {
  installGlobalErrorHandlers,
} = require('../src/observability/globalErrors.ts');
const {
  checkBoardSize,
  checkCampaignIds,
  checkChapterIds,
  checkCanonicalCampaign,
  checkTrayCapacity,
  checkRewardUnclaimed,
  diagnosePersistenceWrite,
} = require('../src/observability/runtimeInvariants.ts');
const {
  isChapterModeUnlocked,
} = require('../src/utils/chapterAvailability.ts');
const { LEVELS } = require('../src/data/levels.ts');
test('release filters low levels, bounds buffer, redacts and snapshots domain context', () => {
  const original = console.warn;
  console.warn = () => {};
  try {
    logger.log('info', 'test', 'discarded');
    assert.equal(logger.getDiagnosticEntries().length, 0);
    logger.setDiagnosticContext({
      levelId: 'ch01-001',
      seed: 42,
      retry: false,
    });
    for (let i = 0; i < 205; i++)
      logger.log(
        'warn',
        'test',
        String(i),
        new Error('Bearer abc user@example.com'),
      );
    const entries = logger.getDiagnosticEntries();
    assert.equal(entries.length, 200);
    assert.equal(entries[0].message, '5');
    assert.equal(entries[0].context.seed, 42);
    entries[0].context.seed = 8;
    assert.equal(logger.getDiagnosticEntries()[0].context.seed, 42);
    assert.ok(!logger.diagnosticReport().includes('user@example.com'));
    assert.ok(!logger.diagnosticReport().includes('Bearer abc'));
  } finally {
    console.warn = original;
  }
});
test('global capture chains fatal handler, restores it and removes rejection listener', () => {
  const original = console.error;
  console.error = () => {};
  try {
    let fatal;
    const previous = (_, value) => {
      fatal = value;
    };
    let current = previous;
    let listener;
    let removed;
    const cleanup = installGlobalErrorHandlers({
      ErrorUtils: {
        getGlobalHandler: () => current,
        setGlobalHandler: (value) => {
          current = value;
        },
      },
      addEventListener: (_, fn) => {
        listener = fn;
      },
      removeEventListener: (_, fn) => {
        removed = fn;
      },
    });
    current(new Error('timeout'), true);
    assert.equal(fatal, true);
    listener({ reason: new Error('storage') });
    assert.equal(logger.getDiagnosticEntries().at(-1).namespace, 'promise');
    cleanup();
    assert.equal(current, previous);
    assert.equal(removed, listener);
    assert.equal(checkBoardSize(4), false);
    assert.equal(checkBoardSize(6), true);
    assert.equal(checkCampaignIds(['ch01-001']), false);
  } finally {
    console.error = original;
  }
});
test('extra mode requires all main campaign stages, without requiring bonus or changing save', () => {
  const progress = { levelStars: {} };
  assert.equal(isChapterModeUnlocked(progress), false);
  for (const level of LEVELS.filter((level) => level.worldId <= 10))
    progress.levelStars[level.id] = 1;
  const before = JSON.stringify(progress);
  assert.equal(isChapterModeUnlocked(progress), true);
  assert.equal(JSON.stringify(progress), before);
  delete progress.levelStars['w10-010'];
  assert.equal(isChapterModeUnlocked(progress), false);
});

test('optional remote reporter deduplicates errors and cannot break fatal handling', () => {
  const {
    configureRemoteErrorReporter,
    reportRemoteError,
  } = require('../src/observability/errorReporter.ts');
  const calls = [];
  const error = new Error('fixture');
  reportRemoteError(error);
  configureRemoteErrorReporter((value) => calls.push(value));
  reportRemoteError(error);
  reportRemoteError(error);
  assert.deepEqual(calls, [error]);
  reportRemoteError('sensitive arbitrary rejection');
  assert.equal(calls[1].message, 'Unhandled non-Error rejection');
  configureRemoteErrorReporter(() => {
    throw new Error('SDK failure');
  });
  assert.doesNotThrow(() => reportRemoteError(new Error('original')));
  configureRemoteErrorReporter();
});

test('runtime content checks detect same-length corruption without exposing or changing levels', () => {
  const before = JSON.stringify(LEVELS);
  assert.equal(checkCanonicalCampaign(LEVELS), true);
  const changed = JSON.parse(before);
  changed[0].tileCount += 3;
  assert.equal(checkCanonicalCampaign(changed), false);
  assert.equal(checkCanonicalCampaign(LEVELS.slice(1)), false);
  assert.equal(JSON.stringify(LEVELS), before);
  const entry = logger.getDiagnosticEntries().at(-1);
  assert.equal(entry.message, 'canonical-campaign-content');
  assert.equal(entry.namespace, 'invariant');
  assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
  assert.equal(entry.detail, undefined);
});
test('invalid tray input, crossed storage ids and a claimed async reward only emit diagnostics', () => {
  for (const capacity of [7, 8, 9])
    assert.equal(checkTrayCapacity(capacity, 7, 9), true);
  for (const capacity of [undefined, NaN, 6, 10, 7.5])
    assert.equal(checkTrayCapacity(capacity, 7, 9), false);
  assert.equal(checkChapterIds(['ch01-001']), true);
  assert.equal(checkChapterIds(['w1-001']), false);
  assert.equal(checkChapterIds(['bonus-w1-001']), false);
  assert.equal(checkRewardUnclaimed(false), true);
  assert.equal(checkRewardUnclaimed(true), false);
});
test('persistence diagnostics observe overlap and preserve results, independent scopes and storage failures', async () => {
  const diagnostics = () =>
    logger
      .getDiagnosticEntries()
      .filter((entry) => entry.message.endsWith('writes-serialized'));
  const before = diagnostics().length;
  let release;
  const pending = diagnosePersistenceWrite(
    'campaign',
    'commitProgress',
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const chapter = await diagnosePersistenceWrite(
    'chapter',
    'commitChapterProgress',
    async () => 23,
  );
  assert.equal(chapter, 23);
  assert.equal(diagnostics().length, before);
  assert.equal(
    await diagnosePersistenceWrite(
      'campaign',
      'commitProgress',
      async () => 42,
    ),
    42,
  );
  assert.equal(diagnostics().length, before + 1);
  release(17);
  assert.equal(await pending, 17);
  const failure = new Error('fixture storage failure');
  await assert.rejects(
    diagnosePersistenceWrite('campaign', 'commitProgress', async () => {
      throw failure;
    }),
    (error) => error === failure,
  );
  assert.equal(
    await diagnosePersistenceWrite(
      'campaign',
      'commitProgress',
      async () => 'recovered',
    ),
    'recovered',
  );
  assert.equal(diagnostics().length, before + 1);
  await diagnosePersistenceWrite('lives', undefined, async () => undefined);
  assert.equal(
    logger.getDiagnosticEntries().at(-1).message,
    'lives-write-through-owner',
  );
});
