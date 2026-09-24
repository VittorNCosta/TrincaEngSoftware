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
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
};
const {
  createBoardVariation,
} = require('../src/screens/game/createBoardVariation.ts');
const { createSeededRandom } = require('../src/utils/deterministicRandom.ts');
const {
  getWorldMapHeight,
  getLevelNodePosition,
  getShopMarkerPosition,
  getPortalMarkerPosition,
} = require('../src/screens/levelSelect/mapPresentation.ts');
const { LEVELS } = require('../src/data/levels.ts');

test('extração da montagem preserva capítulos estáveis e retry com nova variação', () => {
  const initial = createBoardVariation('ch01-001');
  assert.deepEqual(createBoardVariation('ch01-001'), initial);
  const retry = createBoardVariation('ch01-001', {
    random: createSeededRandom(321),
  });
  assert.notDeepEqual(retry, initial);
  assert.equal(retry.length, initial.length);
  assert.equal(initial.length % 3, 0);
});

test('campanha gerada não altera as fases canônicas', () => {
  const before = JSON.stringify(LEVELS);
  const first = createBoardVariation('w1-001', {
    random: createSeededRandom(10),
  });
  const second = createBoardVariation('w1-001', {
    random: createSeededRandom(10),
  });
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(LEVELS), before);
});

test('geometria mantém fases e marcadores dentro do mapa em campanhas curtas e longas', () => {
  for (const count of [3, 10, 25, 100]) {
    const height = getWorldMapHeight(count);
    for (let index = 0; index < count; index++) {
      for (const point of [
        getLevelNodePosition(index, height),
        getShopMarkerPosition(index, height, true),
        getPortalMarkerPosition(index, height),
      ]) {
        assert.ok(point.top >= 0 && point.top < height);
        assert.ok(point.left >= 0 && point.left < 320);
      }
      if (index)
        assert.ok(
          getLevelNodePosition(index, height).top <
            getLevelNodePosition(index - 1, height).top,
        );
    }
  }
});
