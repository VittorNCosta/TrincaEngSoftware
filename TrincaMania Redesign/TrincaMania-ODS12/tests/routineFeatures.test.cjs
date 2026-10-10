const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
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
};

const store = new Map();
const storageFile =
  require.resolve('@react-native-async-storage/async-storage');
require.cache[storageFile] = {
  id: storageFile,
  filename: storageFile,
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

const checkIn = require('../src/dailyCheckIn/dailyCheckIn.ts');
const checkInRewards = require('../src/dailyCheckIn/dailyCheckInRewards.ts');
const progress = require('../src/storage/progressStorage.ts');
const lives = require('../src/storage/livesStorage.ts');
const missions = require('../src/missions/routineMissions.ts');
const challenge = require('../src/challenges/dailyChallenge.ts');
const { LEVELS } = require('../src/data/levels.ts');
const combo = require('../src/utils/combo.ts');
const musicRouting = require('../src/utils/musicRouting.ts');

test('check-in avança uma vez por dia e mantém uma operação pendente recuperável', () => {
  const first = checkIn.createInitialDailyCheckInState();
  const pending = checkIn.beginDailyCheckInClaim(
    first,
    '2026-10-06',
    { kind: 'coins', amount: 10, label: '+10 moedas', title: 'Boas-vindas' },
    'checkin:2026-10-06',
  );
  assert.equal(pending.pendingClaim.operationId, 'checkin:2026-10-06');
  assert.equal(
    checkIn.getDailyCheckInStatus(pending, '2026-10-06').eligible,
    false,
  );
  const done = checkIn.completeDailyCheckInClaim(pending, 'checkin:2026-10-06');
  assert.equal(done.cycleDay, 2);
  assert.equal(done.totalClaims, 1);
  assert.equal(
    checkIn.getDailyCheckInStatus(done, '2026-10-06').eligible,
    false,
  );
  assert.equal(
    checkIn.getDailyCheckInStatus(done, '2026-10-07').eligible,
    true,
  );
});

test('check-in normaliza save legado, bloqueia relógio retrocedido e reinicia após o sétimo dia', () => {
  const invalid = checkIn.normalizeDailyCheckInState({
    cycleDay: 99,
    totalClaims: -8,
    lastClaimDateKey: '2026-02-30',
    pendingClaim: { operationId: '' },
  });
  assert.equal(invalid.cycleDay, 1);
  assert.equal(invalid.totalClaims, 0);
  assert.equal(invalid.pendingClaim, undefined);
  const seventh = checkIn.normalizeDailyCheckInState({
    cycleDay: 7,
    totalClaims: 6,
    maxObservedDateKey: '2026-10-05',
  });
  assert.equal(
    checkIn.getDailyCheckInStatus(seventh, '2026-10-04').reason,
    'clock-rollback',
  );
  const pending = checkIn.beginDailyCheckInClaim(
    seventh,
    '2026-10-06',
    checkInRewards.resolveDailyCheckInReward(7),
    'checkin:day7',
  );
  assert.equal(
    checkIn.completeDailyCheckInClaim(pending, 'wrong').pendingClaim
      .operationId,
    'checkin:day7',
  );
  const completed = checkIn.completeDailyCheckInClaim(pending, 'checkin:day7');
  assert.equal(completed.cycleDay, 1);
  assert.equal(
    checkIn.getDailyCheckInCardState(completed, 7, '2026-10-06'),
    'claimed',
  );
  assert.equal(
    checkIn.getDailyCheckInCardState(completed, 1, '2026-10-07'),
    'today',
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7].map(
      (day) => checkInRewards.resolveDailyCheckInReward(day).kind,
    ),
    ['coins', 'life', 'power', 'coins', 'power', 'power', 'coins'],
  );
  assert.equal(
    checkIn.getDailyCheckInCardState(completed, 3, '2026-10-07'),
    'future',
  );
  const ineligible = checkIn.beginDailyCheckInClaim(
    completed,
    '2026-10-06',
    checkInRewards.resolveDailyCheckInReward(1),
    'duplicate',
  );
  assert.equal(ineligible.pendingClaim, undefined);
  assert.equal(
    checkIn.beginDailyCheckInClaim(
      pending,
      '2026-10-07',
      checkInRewards.resolveDailyCheckInReward(1),
      'second',
    ).pendingClaim.operationId,
    'checkin:day7',
  );
});

test('recompensas repetidas não duplicam moedas, poderes nem vidas', async () => {
  const initial = progress.createInitialProgress();
  const coins = progress.grantRewardForOperation(initial, 'mission:one', {
    coins: 15,
  });
  assert.equal(
    progress.grantRewardForOperation(coins, 'mission:one', { coins: 15 }).coins,
    15,
  );
  const power = progress.grantRewardForOperation(coins, 'checkin:power', {
    powerType: 'hint',
  });
  assert.equal(
    progress.grantRewardForOperation(power, 'checkin:power', {
      powerType: 'hint',
    }).itemCounts.hint,
    1,
  );
  await lives.consumeLife();
  const awarded = await lives.applyLifeRewardForOperation('checkin:life');
  const repeated = await lives.applyLifeRewardForOperation('checkin:life');
  assert.equal(repeated.currentLives, awarded.currentLives);
  assert.ok(repeated.appliedRewardOperationIds.includes('checkin:life'));
});

test('missões contam eventos da partida uma vez e possuem três objetivos por ciclo', () => {
  const state = missions.createMissionState(new Date(2026, 9, 6));
  assert.equal(state.daily.missions.length, 3);
  assert.equal(state.weekly.missions.length, 3);
  const earned = missions.applyMissionEvent(state, {
    id: 'round:triple:1',
    kind: 'triples',
    value: 1,
  });
  const repeated = missions.applyMissionEvent(earned, {
    id: 'round:triple:1',
    kind: 'triples',
    value: 1,
  });
  assert.equal(
    repeated.daily.missions.find((mission) => mission.kind === 'triples')
      .progress,
    1,
  );
  assert.equal(
    repeated.weekly.missions.find((mission) => mission.kind === 'triples')
      .progress,
    1,
  );
  assert.equal(
    missions.syncMissionState(repeated, new Date(2026, 9, 5)).daily.id,
    state.daily.id,
  );
});

test('desafio diário é determinístico, não altera a campanha e registra melhor estrela e sequência', () => {
  const a = challenge.getDailyChallengeLevel('2026-10-06');
  const b = challenge.getDailyChallengeLevel('2026-10-06');
  assert.deepEqual(a.tiles, b.tiles);
  assert.equal(a.difficulty, 'normal');
  assert.equal(
    LEVELS.some((level) => level.id === a.id),
    false,
  );
  const first = challenge.completeDailyChallenge(
    challenge.createInitialDailyChallengeSave(),
    '2026-10-06',
    2,
  );
  const improved = challenge.completeDailyChallenge(first, '2026-10-06', 3);
  assert.equal(improved.streak, 1);
  assert.equal(improved.bestStars['2026-10-06'], 3);
  assert.equal(
    challenge.completeDailyChallenge(improved, '2026-10-07', 1).streak,
    2,
  );
  assert.equal(
    challenge.completeDailyChallenge(improved, '2026-10-05', 3),
    improved,
  );
});

test('combo natural só continua dentro de cinco segundos', () => {
  const first = combo.advanceNaturalCombo(combo.createComboState(), 1000);
  assert.equal(combo.advanceNaturalCombo(first, 6000).count, 2);
  assert.equal(combo.advanceNaturalCombo(first, 6001).count, 1);
});

test('música seleciona as cinco trilhas específicas e usa a geral nos demais mundos', () => {
  for (const world of [1, 2, 3, 4, 21])
    assert.equal(musicRouting.resolveMusicKeyForWorld(world), world);
  for (const world of [5, 6, 101])
    assert.equal(musicRouting.resolveMusicKeyForWorld(world), 'meta');
});

test('preferência de música migra como ligada e salva independente dos efeitos', async () => {
  store.set(
    '@trinca-mania/settings-v1',
    JSON.stringify({ soundEnabled: false, hapticsEnabled: true }),
  );
  const settings = require('../src/storage/settingsStorage.ts');
  const migrated = await settings.getSettings();
  assert.equal(migrated.musicEnabled, true);
  assert.equal(migrated.soundEnabled, false);
  await settings.setMusicEnabledPreference(false);
  assert.equal((await settings.getSettings()).soundEnabled, false);
  assert.equal((await settings.getSettings()).musicEnabled, false);
  await settings.setSoundEnabledPreference(true);
  assert.equal((await settings.getSettings()).musicEnabled, false);
  assert.equal(
    JSON.parse(store.get('@trinca-mania/settings-v1')).musicEnabled,
    false,
  );
});

test('preferências legadas de som migram e dados corrompidos voltam ao padrão', async () => {
  const modulePath = require.resolve('../src/storage/settingsStorage.ts');
  delete require.cache[modulePath];
  store.delete('@trinca-mania/settings-v1');
  store.set('@trinca-mania/sound-enabled-v1', 'false');
  const legacy = require(modulePath);
  assert.equal((await legacy.getSettings()).soundEnabled, false);
  assert.equal((await legacy.getSettings()).musicEnabled, true);
  delete require.cache[modulePath];
  store.set('@trinca-mania/settings-v1', '{corrompido');
  const damaged = require(modulePath);
  assert.equal((await damaged.getSettings()).musicEnabled, true);
});

test('salvamentos da rotina recuperam falha de leitura e persistem conquistas', async () => {
  const saved = await challenge.recordDailyChallengeCompletion('2026-10-06', 2);
  assert.equal(
    (await challenge.loadDailyChallengeSave()).bestStars['2026-10-06'],
    2,
  );
  assert.equal(saved.streak, 1);
  store.set('@trinca-mania/daily-challenge-v1', '{corrompido');
  assert.equal((await challenge.loadDailyChallengeSave()).streak, 0);
  const updated = await missions.recordMissionEvent({
    id: 'save:triple',
    kind: 'triples',
    value: 1,
  });
  assert.equal(
    (await missions.loadMissionState()).daily.missions.find(
      (mission) => mission.kind === 'triples',
    ).progress,
    1,
  );
  assert.ok(updated.processedEventIds.includes('save:triple'));
});
