const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
  applyLevelCompletion,
  createInitialProgress,
  normalizeProgress,
  purchasePowerUpTransaction,
} = require('../src/storage/progressStorage.ts');
const { POWER_UP_COSTS } = require('../src/utils/gameLogic.ts');
const { LEVELS } = require('../src/data/levels.ts');

/**
 * `normalizeProgress` trocou varreduras lineares (`Array.includes` / `Array.find`
 * sobre as 100 fases) por Set/Map. A troca e puramente de desempenho: a saida
 * tem de continuar byte-identica.
 *
 * Os valores de `GOLDEN` abaixo foram gerados executando o `progressStorage.ts`
 * ANTERIOR a otimizacao. Se qualquer assert aqui falhar, a otimizacao mudou
 * regra de negocio — nao e um teste desatualizado.
 */
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const campaignLevelIds = LEVELS.filter((level) => level.worldId !== 21).map((level) => level.id);
const bonusLevelIds = LEVELS.filter((level) => level.worldId === 21).map((level) => level.id);
const world1LevelIds = LEVELS.filter((level) => level.worldId === 1).map((level) => level.id);

const starsFor = (levelIds, value) =>
  levelIds.reduce((stars, levelId) => {
    stars[levelId] = typeof value === 'function' ? value(levelId) : value;
    return stars;
  }, {});

const base = createInitialProgress();

const SCENARIOS = [
  ['vazio', {}],
  ['inicial', { ...base }],
  ['parcial-40', {
    ...base,
    coins: 1234,
    keys: 2,
    completedLevelIds: campaignLevelIds.slice(0, 40),
    levelStars: starsFor(campaignLevelIds.slice(0, 40), (id) => (id.charCodeAt(4) % 3) + 1),
    itemCounts: { hint: 3, shuffle: 1, undo: 7 },
  }],
  ['campanha-completa-100', {
    ...base,
    coins: 99999,
    keys: 5,
    chestProgressLevelIds: campaignLevelIds,
    completedLevelIds: campaignLevelIds,
    levelStars: starsFor(campaignLevelIds, 3),
    itemCounts: { hint: 10, shuffle: 10, undo: 10 },
  }],
  ['ids-invalidos', {
    ...base,
    completedLevelIds: ['w1-001', 'NAO-EXISTE', 'w1-002', 'w1-001', 42, null, undefined, 'w99-999'],
    unlockedLevelIds: ['zzz', 'w1-003', 'w1-003', {}, 'chapter-0001'],
    collectedRestCheckpointIds: ['w1-005', 'lixo', 7],
    chestProgressLevelIds: ['w1-001', 'inexistente', 'bonus-w1-001'],
    levelStars: { 'w1-001': 3, 'nao-existe': 3, 'w1-002': 2 },
  }],
  ['estrelas-fora-de-faixa', {
    ...base,
    completedLevelIds: world1LevelIds.slice(0, 10),
    levelStars: {
      'w1-001': 0,
      'w1-002': -5,
      'w1-003': 7,
      'w1-004': 2.7,
      'w1-005': NaN,
      'w1-006': '3',
      'w1-007': null,
      'w1-008': Infinity,
      'w1-009': 1.999,
      'w1-010': 3,
      'w2-001': true,
    },
  }],
  ['bonus-desbloqueado', {
    ...base,
    completedLevelIds: world1LevelIds,
    levelStars: starsFor(world1LevelIds, 3),
  }],
  ['bonus-nao-desbloqueado', {
    ...base,
    completedLevelIds: world1LevelIds,
    levelStars: { ...starsFor(world1LevelIds, 3), 'w1-005': 2 },
  }],
  ['bau-pendente', {
    ...base,
    completedLevelIds: [...world1LevelIds, ...bonusLevelIds],
    levelStars: starsFor([...world1LevelIds, ...bonusLevelIds], 3),
  }],
  ['bau-reivindicado', {
    ...base,
    completedLevelIds: [...world1LevelIds, ...bonusLevelIds],
    levelStars: starsFor([...world1LevelIds, ...bonusLevelIds], 3),
    claimedWorldChestIds: ['bonus-world-21'],
    pendingWorldChestIds: ['bonus-world-21', 'lixo'],
  }],
  ['tipos-lixo', {
    completedLevelIds: 'nao-e-array',
    unlockedLevelIds: null,
    chestProgressLevelIds: undefined,
    claimedWorldChestIds: 12,
    pendingWorldChestIds: {},
    collectedRestCheckpointIds: false,
    levelStars: [1, 2, 3],
    itemCounts: 'nada',
    coins: -50.9,
    keys: 3.9,
    bonusWorldAchievementShown: 'sim',
  }],
  ['coins-keys-negativos', { ...base, coins: -1, keys: -10, bonusWorldAchievementShown: true }],
  ['campanha-mais-bonus-parcial', {
    ...base,
    completedLevelIds: [...campaignLevelIds, bonusLevelIds[0]],
    levelStars: { ...starsFor(campaignLevelIds, 3), [bonusLevelIds[0]]: 2 },
    coins: 500,
  }],
];

const GOLDEN = {
  'vazio': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 0,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '88ef9c0451ed9b9f23e585ac2ca901eb8443aacdba79a03edb2beadafd346576',
    starsCount: 0,
    unlockedCount: 1,
  },
  'inicial': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 0,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '88ef9c0451ed9b9f23e585ac2ca901eb8443aacdba79a03edb2beadafd346576',
    starsCount: 0,
    unlockedCount: 1,
  },
  'parcial-40': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 1234,
    completedCount: 40,
    keys: 2,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: 'f9aa2dc98cbbeff4bd6aca7c76a16220b185e77c454eb741827b8020930ee061',
    starsCount: 40,
    unlockedCount: 41,
  },
  'campanha-completa-100': {
    chestProgressCount: 100,
    claimedWorldChestIds: [],
    coins: 99999,
    completedCount: 100,
    keys: 5,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '0c6f88cc650175251562919be06bad990d07627821feb868cdfeb754633760a8',
    starsCount: 100,
    unlockedCount: 101,
  },
  'ids-invalidos': {
    chestProgressCount: 1,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 2,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 1,
    sha256: 'd564773d89670cada26d139608e64e732015205a2208da003a6fdc69c5940878',
    starsCount: 2,
    unlockedCount: 3,
  },
  'estrelas-fora-de-faixa': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 10,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '38c6efcd447b360e51dd7539681e0573027f56cbc4692360811de0a8509b2bef',
    starsCount: 10,
    unlockedCount: 11,
  },
  'bonus-desbloqueado': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 10,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: 'f96fcffb0660a4b9f914284118f8a20cf794102a2f9dc1b66bd5c64d720d99f7',
    starsCount: 10,
    unlockedCount: 12,
  },
  'bonus-nao-desbloqueado': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 10,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: 'a9a5e007b7464b13fb906c73470ed53f8fe4ac00536729fa20d749392053c8c3',
    starsCount: 10,
    unlockedCount: 11,
  },
  'bau-pendente': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 13,
    keys: 0,
    pendingWorldChestIds: ['bonus-world-21'],
    restCount: 0,
    sha256: 'd2a8ec14c546ce2c4f08f812a7e1de914fb6687c52f566ca1d983d8dbf133958',
    starsCount: 13,
    unlockedCount: 14,
  },
  'bau-reivindicado': {
    chestProgressCount: 0,
    claimedWorldChestIds: ['bonus-world-21'],
    coins: 0,
    completedCount: 13,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: 'ccc69634516f5095c0d23716dba6ad7d8a8ec468b517b1a78cc1bfc38a0741c3',
    starsCount: 13,
    unlockedCount: 14,
  },
  'tipos-lixo': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 0,
    keys: 3,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '29dab7b71a0583ad73460c59deadab6773ece53379d1fd9997d41631a13e31c0',
    starsCount: 0,
    unlockedCount: 1,
  },
  'coins-keys-negativos': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 0,
    completedCount: 0,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: '02aa836bb0472c85dca4cd491d844f6b3ace9691195957d42813610eb62920bd',
    starsCount: 0,
    unlockedCount: 1,
  },
  'campanha-mais-bonus-parcial': {
    chestProgressCount: 0,
    claimedWorldChestIds: [],
    coins: 500,
    completedCount: 101,
    keys: 0,
    pendingWorldChestIds: [],
    restCount: 0,
    sha256: 'd01ab606dfbde8bffe5f96988346d3dff188afab7127fcd009e6e1edf97419fc',
    starsCount: 101,
    unlockedCount: 102,
  },
};

test('normalizeProgress preserva a saida byte-a-byte apos a troca por Set/Map', () => {
  assert.equal(SCENARIOS.length, Object.keys(GOLDEN).length);

  SCENARIOS.forEach(([name, input]) => {
    const expected = GOLDEN[name];
    assert.ok(expected, `cenario sem golden: ${name}`);

    const output = normalizeProgress(structuredClone(input));

    // Os campos legiveis vem primeiro: quando algo quebra, eles dizem O QUE mudou.
    assert.equal(output.completedLevelIds.length, expected.completedCount, `${name}: completedLevelIds`);
    assert.equal(output.unlockedLevelIds.length, expected.unlockedCount, `${name}: unlockedLevelIds`);
    assert.equal(Object.keys(output.levelStars).length, expected.starsCount, `${name}: levelStars`);
    assert.equal(output.chestProgressLevelIds.length, expected.chestProgressCount, `${name}: chestProgressLevelIds`);
    assert.equal(output.collectedRestCheckpointIds.length, expected.restCount, `${name}: collectedRestCheckpointIds`);
    assert.equal(output.coins, expected.coins, `${name}: coins`);
    assert.equal(output.keys, expected.keys, `${name}: keys`);
    assert.deepEqual(output.pendingWorldChestIds, expected.pendingWorldChestIds, `${name}: pendingWorldChestIds`);
    assert.deepEqual(output.claimedWorldChestIds, expected.claimedWorldChestIds, `${name}: claimedWorldChestIds`);

    // E o hash fecha o que os campos acima nao cobrem (ordem, estrelas por fase).
    assert.equal(sha256(JSON.stringify(output)), expected.sha256, `${name}: saida divergiu do golden pre-otimizacao`);
  });
});

test('normalizeProgress e idempotente — encadear chamadas nao muda o estado', () => {
  SCENARIOS.forEach(([name, input]) => {
    const once = normalizeProgress(structuredClone(input));
    const twice = normalizeProgress(once);
    const thrice = normalizeProgress(twice);

    assert.equal(JSON.stringify(twice), JSON.stringify(once), `${name}: 2a normalizacao mudou o estado`);
    assert.equal(JSON.stringify(thrice), JSON.stringify(once), `${name}: 3a normalizacao mudou o estado`);
  });
});

test('estrelas invalidas continuam sendo fixadas na faixa 1..3 e ids desconhecidos sao descartados', () => {
  const [, input] = SCENARIOS.find(([name]) => name === 'estrelas-fora-de-faixa');
  const { levelStars } = normalizeProgress(structuredClone(input));

  assert.equal(levelStars['w1-001'], 1); // 0 -> completada -> 1
  assert.equal(levelStars['w1-002'], 1); // -5 -> fixado em 1
  assert.equal(levelStars['w1-003'], 3); // 7 -> fixado em 3
  assert.equal(levelStars['w1-004'], 2); // 2.7 -> truncado para 2
  assert.equal(levelStars['w1-006'], 1); // '3' nao e number -> descartado -> completada -> 1
  assert.equal(levelStars['w1-009'], 1); // 1.999 -> truncado para 1
  assert.equal(levelStars['w1-010'], 3);
  assert.equal(levelStars['w2-001'], undefined); // true nao e number
  assert.ok(Object.values(levelStars).every((value) => value >= 1 && value <= 3));
});

test('a cadeia de 4 normalizeProgress de uma compra-e-uso continua consistente', () => {
  const progress = normalizeProgress({
    ...base,
    chestProgressLevelIds: campaignLevelIds,
    coins: 99999,
    completedLevelIds: campaignLevelIds,
    levelStars: starsFor(campaignLevelIds, 3),
  });
  const result = purchasePowerUpTransaction(progress, 'hint', true);

  assert.ok(result);
  assert.equal(result.coins, 99999 - POWER_UP_COSTS.hint);
  assert.equal(result.itemCounts.hint, 0);
  assert.equal(result.completedLevelIds.length, 100);
  assert.equal(result.unlockedLevelIds.length, 101);
  assert.equal(JSON.stringify(normalizeProgress(result)), JSON.stringify(result));
});

test('applyLevelCompletion no fim da campanha mantem contagens e desbloqueios', () => {
  const progress = normalizeProgress({
    ...base,
    chestProgressLevelIds: campaignLevelIds.slice(0, 99),
    completedLevelIds: campaignLevelIds.slice(0, 99),
    levelStars: starsFor(campaignLevelIds.slice(0, 99), 3),
  });
  const result = applyLevelCompletion(progress, 'w10-010', 3);

  assert.equal(result.savedStars, 3);
  assert.equal(result.starsEarned, 3);
  assert.equal(result.progress.completedLevelIds.length, 100);
  assert.equal(result.progress.chestProgressLevelIds.length, 100);
  assert.equal(result.progress.levelStars['w10-010'], 3);
  assert.equal(JSON.stringify(normalizeProgress(result.progress)), JSON.stringify(result.progress));
});
