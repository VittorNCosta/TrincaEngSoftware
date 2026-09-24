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
  calculateStarsByTime,
  createVictoryResultSnapshot,
  formatQuantity,
  getVictoryTitleByStars,
} = require('../src/utils/gameLogic.ts');
const {
  applyLevelCompletion,
  createInitialProgress,
} = require('../src/storage/progressStorage.ts');

const level = {
  starTimeLimits: {
    threeStars: 60,
    twoStars: 120,
  },
};

test('calcula 3, 2 e 1 estrelas nos limites de tempo', () => {
  assert.equal(calculateStarsByTime(30, level), 3);
  assert.equal(calculateStarsByTime(60, level), 3);
  assert.equal(calculateStarsByTime(61, level), 2);
  assert.equal(calculateStarsByTime(120, level), 2);
  assert.equal(calculateStarsByTime(121, level), 1);
  assert.equal(calculateStarsByTime(999, level), 1);
});

test('cria um snapshot imutável em relação ao relógio posterior', () => {
  let elapsedSeconds = 60.9;
  const result = createVictoryResultSnapshot({
    elapsedSeconds,
    level,
    previousBestStars: 2,
  });

  elapsedSeconds = 121;

  assert.deepEqual(result, {
    earnedStars: 3,
    elapsedSeconds: 60,
    isNewRecord: true,
    previousBestStars: 2,
    savedStars: 3,
  });
  assert.equal(elapsedSeconds, 121);
});

test('preserva conceitualmente o melhor resultado já salvo', () => {
  const result = createVictoryResultSnapshot({
    elapsedSeconds: 180,
    level,
    previousBestStars: 3,
  });

  assert.equal(result.earnedStars, 1);
  assert.equal(result.savedStars, 3);
  assert.equal(result.isNewRecord, false);
});

test('persistencia mantém três estrelas anteriores após vitória lenta de uma estrela', () => {
  const levelId = 'w1-001';
  const previousProgress = {
    ...createInitialProgress(),
    completedLevelIds: [levelId],
    levelStars: { [levelId]: 3 },
  };
  const displayed = createVictoryResultSnapshot({
    elapsedSeconds: 180,
    level,
    previousBestStars: 3,
  });
  const completion = applyLevelCompletion(
    previousProgress,
    levelId,
    displayed.earnedStars,
  );

  assert.equal(displayed.earnedStars, 1);
  assert.equal(completion.starsEarned, displayed.earnedStars);
  assert.equal(completion.savedStars, 3);
  assert.equal(completion.progress.levelStars[levelId], 3);
});

test('snapshot exibido e entrada persistida usam a mesma quantidade de estrelas', () => {
  const levelId = 'w1-001';
  const displayed = createVictoryResultSnapshot({
    elapsedSeconds: 90,
    level,
  });
  const completion = applyLevelCompletion(
    createInitialProgress(),
    levelId,
    displayed.earnedStars,
  );

  assert.equal(displayed.earnedStars, 2);
  assert.equal(completion.starsEarned, displayed.earnedStars);
  assert.equal(completion.progress.levelStars[levelId], displayed.savedStars);
});

test('primeira conclusão registra até uma vitória de uma estrela', () => {
  const result = createVictoryResultSnapshot({
    elapsedSeconds: 180,
    level,
  });

  assert.equal(result.earnedStars, 1);
  assert.equal(result.savedStars, 1);
  assert.equal(result.isNewRecord, true);
});

test('títulos e pluralização são determinísticos', () => {
  assert.equal(getVictoryTitleByStars(3), 'Reciclagem perfeita!');
  assert.equal(getVictoryTitleByStars(2), 'Excelente separação!');
  assert.equal(getVictoryTitleByStars(1), 'Fase concluída!');
  assert.equal(formatQuantity(0, 'moeda', 'moedas'), '0 moedas');
  assert.equal(formatQuantity(1, 'moeda', 'moedas'), '1 moeda');
  assert.equal(formatQuantity(2, 'chave', 'chaves'), '2 chaves');
});
