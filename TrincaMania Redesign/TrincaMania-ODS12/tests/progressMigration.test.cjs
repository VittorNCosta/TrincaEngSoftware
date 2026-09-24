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
  detectDroppedCampaignProgress,
  normalizeProgress,
} = require('../src/storage/progressStorage.ts');

/**
 * C-25/C-26: a campanha encolheu de 203 para 103 fases (10 mundos x 10 + 3
 * bônus, antes 8 mundos x 25 + 3 bônus). `normalizeProgress` já descarta id
 * de fase desconhecido em silêncio (invariante #3) — o que evita crash ao
 * carregar um save antigo, mas por si só nunca avisa o jogador. Este arquivo
 * trava duas garantias:
 *
 * 1. `detectDroppedCampaignProgress` conta certo quanto progresso de campanha
 *    (nunca bônus, nunca capítulo) um save antigo perde, para a UI decidir
 *    quando mostrar o aviso de "campanha mudou de tamanho".
 * 2. Esse descarte é seguro por construção: como os ids `wN-001`..`wN-010`
 *    são idênticos entre o esquema antigo e o novo, só fica de fora fase que
 *    de fato não existe mais — moedas, chaves e itens nunca são tocados.
 *
 * Os ids "antigos" abaixo (`wN-011`..`wN-025`) não existem mais em
 * `src/data/levels.ts` — são reconstruídos aqui no formato que o esquema
 * pré-resize usava, para simular um save real gravado antes da mudança.
 */

const oldLevelId = (worldNumber, levelNumber) =>
  `w${worldNumber}-${String(levelNumber).padStart(3, '0')}`;

const oldWorldLevelIds = (worldNumber, count = 25) =>
  Array.from({ length: count }, (_, index) =>
    oldLevelId(worldNumber, index + 1),
  );

const base = createInitialProgress();

test('detectDroppedCampaignProgress não acusa nada para save vazio, nulo ou ausente', () => {
  assert.deepEqual(detectDroppedCampaignProgress(undefined), {
    droppedLevelCount: 0,
  });
  assert.deepEqual(detectDroppedCampaignProgress(null), {
    droppedLevelCount: 0,
  });
  assert.deepEqual(detectDroppedCampaignProgress({}), { droppedLevelCount: 0 });
  assert.deepEqual(
    detectDroppedCampaignProgress({ completedLevelIds: undefined }),
    { droppedLevelCount: 0 },
  );
});

test('detectDroppedCampaignProgress ignora completedLevelIds que não é array', () => {
  assert.deepEqual(
    detectDroppedCampaignProgress({ completedLevelIds: 'w1-001' }),
    { droppedLevelCount: 0 },
  );
  assert.deepEqual(detectDroppedCampaignProgress({ completedLevelIds: 42 }), {
    droppedLevelCount: 0,
  });
});

test('detectDroppedCampaignProgress não acusa nada quando o save já cabe no esquema novo (até a fase 10 de cada mundo)', () => {
  const raw = {
    ...base,
    completedLevelIds: [
      ...oldWorldLevelIds(1, 10),
      ...oldWorldLevelIds(2, 10),
      'bonus-w1-001',
      'bonus-w1-002',
    ],
  };

  assert.deepEqual(detectDroppedCampaignProgress(raw), {
    droppedLevelCount: 0,
  });
});

test('detectDroppedCampaignProgress conta exatamente as fases de campanha que deixaram de existir', () => {
  const raw = {
    ...base,
    completedLevelIds: oldWorldLevelIds(3, 25),
  };

  // Mundo 3 completo no esquema antigo (25 fases): só w3-001..w3-010
  // continuam existindo no esquema novo, as outras 15 caem fora.
  assert.deepEqual(detectDroppedCampaignProgress(raw), {
    droppedLevelCount: 15,
  });
});

test('detectDroppedCampaignProgress nunca conta ids de bônus ou de capítulo, mesmo formatados como texto plausível', () => {
  const raw = {
    ...base,
    completedLevelIds: [
      ...oldWorldLevelIds(1, 10),
      'bonus-w1-001',
      'bonus-w1-002',
      'bonus-w1-003',
      'ch01-001',
      'ch10-100',
    ],
  };

  assert.deepEqual(detectDroppedCampaignProgress(raw), {
    droppedLevelCount: 0,
  });
});

test('detectDroppedCampaignProgress no save de um jogador que zerou os 8 mundos antigos (203 fases)', () => {
  const oldCompletionistIds = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((worldNumber) =>
    oldWorldLevelIds(worldNumber, 25),
  );
  const raw = {
    ...base,
    coins: 99999,
    keys: 7,
    completedLevelIds: [
      ...oldCompletionistIds,
      'bonus-w1-001',
      'bonus-w1-002',
      'bonus-w1-003',
    ],
    itemCounts: { hint: 4, shuffle: 2, undo: 9 },
  };

  // 8 mundos x (25 - 10) fases que não existem mais no esquema novo.
  assert.deepEqual(detectDroppedCampaignProgress(raw), {
    droppedLevelCount: 120,
  });

  // O descarte é seguro por construção: normalizeProgress não perde nada
  // além das próprias fases que não existem mais — moedas, chaves e itens
  // atravessam intactos, e as fases w1-001..w10-010 que ainda existem (mais
  // o bônus) continuam marcadas como concluídas.
  const normalized = normalizeProgress(raw);
  assert.equal(normalized.coins, 99999);
  assert.equal(normalized.keys, 7);
  assert.deepEqual(normalized.itemCounts, { hint: 4, shuffle: 2, undo: 9 });
  assert.equal(normalized.completedLevelIds.length, 8 * 10 + 3);
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((worldNumber) => {
    oldWorldLevelIds(worldNumber, 10).forEach((levelId) => {
      assert.ok(
        normalized.completedLevelIds.includes(levelId),
        `esperava ${levelId} preservado após a migração`,
      );
    });
  });
  ['bonus-w1-001', 'bonus-w1-002', 'bonus-w1-003'].forEach((bonusLevelId) => {
    assert.ok(normalized.completedLevelIds.includes(bonusLevelId));
  });
});
