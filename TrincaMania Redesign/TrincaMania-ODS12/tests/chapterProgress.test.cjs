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
  applyChapterMapCompletion,
  createInitialChapterProgress,
  getChapterMapStars,
  getChapterProgressSummaries,
  getNextChapterMapId,
  isChapterMapUnlocked,
  normalizeChapterProgress,
} = require('../src/storage/chapterProgressStorage.ts');
const {
  createChestProgressSummary,
  createInitialProgress,
  normalizeProgress,
} = require('../src/storage/progressStorage.ts');
const {
  CHAPTERS,
  CHAPTER_COUNT,
  CHAPTER_LEVELS,
  CHAPTER_MAPS_PER_CHAPTER,
  buildChapterLevel,
  getChapter,
  getChapterLevelSummary,
} = require('../src/data/chapters.ts');
const { LEVELS } = require('../src/data/levels.ts');
const { generatePlayableLevel } = require('../src/utils/levelGenerator.ts');
const {
  getIncrementalCoinRewardForLevel,
} = require('../src/utils/gameLogic.ts');

const FIRST_MAP_ID = CHAPTER_LEVELS[0].id;
const SECOND_MAP_ID = CHAPTER_LEVELS[1].id;
const LAST_MAP_ID = CHAPTER_LEVELS[CHAPTER_LEVELS.length - 1].id;

const completeMaps = (mapIds) =>
  mapIds.reduce(
    (progress, mapId) => applyChapterMapCompletion(progress, mapId, 3).progress,
    createInitialChapterProgress(),
  );

test('progresso de capítulo mora fora da campanha e não a corrompe', () => {
  // Este é o motivo da chave separada: id de capítulo entregue a
  // `normalizeProgress` é descartado em silêncio, então guardá-lo lá perderia o
  // progresso do jogador.
  const campaignProgress = normalizeProgress({
    ...createInitialProgress(),
    completedLevelIds: ['w1-001', FIRST_MAP_ID],
    levelStars: { 'w1-001': 3, [FIRST_MAP_ID]: 3 },
  });

  assert.equal(
    campaignProgress.completedLevelIds.includes(FIRST_MAP_ID),
    false,
  );
  assert.equal(campaignProgress.levelStars[FIRST_MAP_ID], undefined);
  assert.deepEqual(campaignProgress.completedLevelIds, ['w1-001']);

  // E o inverso: a chave dos capítulos rejeita id de campanha.
  const chapterProgress = normalizeChapterProgress({
    mapStars: { 'w1-001': 3, [FIRST_MAP_ID]: 2 },
  });

  assert.deepEqual(chapterProgress.mapStars, { [FIRST_MAP_ID]: 2 });
});

test('a campanha canônica segue intocada pelos capítulos', () => {
  assert.equal(LEVELS.length, 203);
  assert.deepEqual(createInitialProgress().unlockedLevelIds, ['w1-001']);
  assert.equal(
    LEVELS.some((level) => getChapterLevelSummary(level.id) !== undefined),
    false,
  );
});

test('só o primeiro mapa abre sozinho; o resto exige o anterior concluído', () => {
  const empty = createInitialChapterProgress();

  assert.equal(isChapterMapUnlocked(FIRST_MAP_ID, empty), true);
  assert.equal(isChapterMapUnlocked(SECOND_MAP_ID, empty), false);
  assert.equal(isChapterMapUnlocked('ch01-050', empty), false);
  assert.equal(isChapterMapUnlocked('w1-001', empty), false);
  assert.equal(isChapterMapUnlocked('ch99-999', empty), false);

  const afterFirst = applyChapterMapCompletion(empty, FIRST_MAP_ID, 2).progress;

  assert.equal(isChapterMapUnlocked(SECOND_MAP_ID, afterFirst), true);
  assert.equal(isChapterMapUnlocked(CHAPTER_LEVELS[2].id, afterFirst), false);
});

test('concluir o mapa 100 abre o capítulo seguinte e só ele', () => {
  const firstChapter = CHAPTERS[0];
  const secondChapter = CHAPTERS[1];
  const beforeGuardian = completeMaps(firstChapter.levelIds.slice(0, -1));

  assert.equal(
    isChapterMapUnlocked(secondChapter.levelIds[0], beforeGuardian),
    false,
  );
  assert.equal(
    getChapterProgressSummaries(beforeGuardian)[1].unlocked,
    false,
    'capítulo 2 continua travado até o guardião cair',
  );

  const afterGuardian = completeMaps(firstChapter.levelIds);

  assert.equal(
    isChapterMapUnlocked(secondChapter.levelIds[0], afterGuardian),
    true,
  );
  assert.equal(
    isChapterMapUnlocked(secondChapter.levelIds[1], afterGuardian),
    false,
  );
  assert.equal(
    isChapterMapUnlocked(CHAPTERS[2].levelIds[0], afterGuardian),
    false,
  );

  const summaries = getChapterProgressSummaries(afterGuardian);
  assert.equal(summaries.length, CHAPTERS.length);
  assert.equal(summaries[0].completedCount, CHAPTER_MAPS_PER_CHAPTER);
  assert.equal(summaries[0].totalCount, CHAPTER_MAPS_PER_CHAPTER);
  assert.equal(summaries[1].completedCount, 0);
  assert.equal(summaries[1].unlocked, true);
  assert.equal(summaries[2].unlocked, false);
});

test('o encadeamento dos 1000 mapas não tem lacuna nem sobra', () => {
  assert.equal(getNextChapterMapId(FIRST_MAP_ID), SECOND_MAP_ID);
  assert.equal(getNextChapterMapId('ch01-100'), 'ch02-001');
  assert.equal(getNextChapterMapId(LAST_MAP_ID), undefined);
  assert.equal(getNextChapterMapId('w1-001'), undefined);
});

test('estrela guardada é sempre a melhor e nunca é rebaixada', () => {
  const afterThree = applyChapterMapCompletion(
    createInitialChapterProgress(),
    FIRST_MAP_ID,
    3,
  );

  assert.equal(afterThree.previousStars, 0);
  assert.equal(afterThree.savedStars, 3);
  assert.equal(afterThree.starsEarned, 3);

  const afterOne = applyChapterMapCompletion(
    afterThree.progress,
    FIRST_MAP_ID,
    1,
  );

  assert.equal(afterOne.previousStars, 3);
  assert.equal(afterOne.savedStars, 3);
  assert.equal(afterOne.starsEarned, 1);
  assert.equal(getChapterMapStars(afterOne.progress, FIRST_MAP_ID), 3);
});

test('a conclusão não muta o estado recebido e anuncia o mapa liberado', () => {
  const before = createInitialChapterProgress();
  const snapshot = structuredClone(before);
  const result = applyChapterMapCompletion(before, FIRST_MAP_ID, 2);

  assert.deepEqual(before, snapshot);
  assert.equal(
    result.unlockedMapTitle,
    getChapterLevelSummary(SECOND_MAP_ID).title,
  );

  // Repetir a mesma fase não anuncia desbloqueio de novo.
  assert.equal(
    applyChapterMapCompletion(result.progress, FIRST_MAP_ID, 3)
      .unlockedMapTitle,
    undefined,
  );
  assert.equal(
    applyChapterMapCompletion(createInitialChapterProgress(), LAST_MAP_ID, 3)
      .unlockedMapTitle,
    undefined,
  );
});

test('a normalização descarta lixo vindo do armazenamento', () => {
  assert.deepEqual(
    normalizeChapterProgress(undefined),
    createInitialChapterProgress(),
  );
  assert.deepEqual(
    normalizeChapterProgress({}),
    createInitialChapterProgress(),
  );
  assert.deepEqual(
    normalizeChapterProgress({ mapStars: [] }),
    createInitialChapterProgress(),
  );
  assert.deepEqual(
    normalizeChapterProgress({
      mapStars: {
        [FIRST_MAP_ID]: 9,
        [SECOND_MAP_ID]: 0,
        'ch01-003': Number.NaN,
        'ch01-004': '3',
        'inexistente-001': 3,
      },
    }).mapStars,
    { [FIRST_MAP_ID]: 3, [SECOND_MAP_ID]: 1 },
  );
});

test('a moeda de capítulo segue a tabela incremental da campanha', () => {
  // Mesmo cálculo que o App faz na conclusão de mapa de capítulo.
  assert.equal(getIncrementalCoinRewardForLevel(0, 1), 10);
  assert.equal(getIncrementalCoinRewardForLevel(0, 3), 35);
  assert.equal(getIncrementalCoinRewardForLevel(3, 3), 0);
  assert.equal(getIncrementalCoinRewardForLevel(3, 1), 0);
  assert.equal(getIncrementalCoinRewardForLevel(1, 3), 25);
});

test('o baú comum da campanha não avança com mapa de capítulo', () => {
  const neutral = createChestProgressSummary(7, false);

  assert.equal(neutral.isLevelCounted, false);
  assert.equal(neutral.opened, false);
  assert.equal(neutral.completedCount, 7);
  assert.equal(neutral.progressCount, 2);
  assert.equal(neutral.remainingCount, 3);
});

test('o "próxima fase" da vitória concorda com o encadeamento real', () => {
  // A tela de resultado decide por `campaignPosition`; o App avança por
  // `getNextChapterMapId`. As duas contas precisam dar a mesma resposta, senão
  // o botão promete um avanço que não acontece (ou esconde um que acontece).
  const lastPosition = CHAPTER_COUNT * CHAPTER_MAPS_PER_CHAPTER;

  assert.equal(CHAPTER_LEVELS.length, lastPosition);
  CHAPTER_LEVELS.forEach((summary) => {
    assert.equal(
      summary.campaignPosition < lastPosition,
      getNextChapterMapId(summary.id) !== undefined,
      `divergência em ${summary.id}`,
    );
  });
});

test('a placa da fase encontra o capítulo e ignora id de campanha', () => {
  const summary = getChapterLevelSummary('ch07-013');

  assert.equal(getChapter(summary.chapterId).name, CHAPTERS[6].name);
  assert.equal(getChapterLevelSummary('w1-001'), undefined);
});

test('o tabuleiro de um mapa de capítulo é o dele, não o de w1-001', () => {
  // `generatePlayableLevel` cai em `LEVELS[0]` quando não acha o id: é por isso
  // que a tela de jogo precisa do desvio para `buildChapterLevel`.
  assert.equal(generatePlayableLevel('ch05-042').id, LEVELS[0].id);

  const summary = getChapterLevelSummary('ch05-042');
  const chapterLevel = buildChapterLevel('ch05-042');

  assert.equal(chapterLevel.id, 'ch05-042');
  assert.equal(chapterLevel.tiles.length, summary.tileCount);
  assert.equal(chapterLevel.worldId, summary.worldId);
  assert.ok(
    chapterLevel.tiles.every((tile) => tile.id.startsWith('ch05-042-')),
  );
  assert.equal(buildChapterLevel('w1-001'), undefined);
});

test('os 1000 mapas atravessam a normalização sem perder nenhum', () => {
  const full = completeMaps(CHAPTER_LEVELS.map((summary) => summary.id));

  assert.equal(Object.keys(full.mapStars).length, CHAPTER_LEVELS.length);
  assert.deepEqual(normalizeChapterProgress(full), full);
  assert.equal(isChapterMapUnlocked(LAST_MAP_ID, full), true);
  assert.ok(CHAPTER_LEVELS.every(({ id }) => full.mapStars[id] === 3));
  assert.ok(
    getChapterProgressSummaries(full).every((summary) => summary.unlocked),
  );
});

test('cada emenda entre capítulos abre exatamente um mapa', () => {
  CHAPTERS.slice(0, -1).forEach((chapter, index) => {
    const nextChapter = CHAPTERS[index + 1];
    const upToGuardian = completeMaps(
      CHAPTERS.slice(0, index + 1).flatMap(({ levelIds }) => levelIds),
    );

    assert.equal(
      getNextChapterMapId(chapter.levelIds[99]),
      nextChapter.levelIds[0],
    );
    assert.equal(
      isChapterMapUnlocked(nextChapter.levelIds[0], upToGuardian),
      true,
    );
    assert.equal(
      isChapterMapUnlocked(nextChapter.levelIds[1], upToGuardian),
      false,
    );
  });
});
