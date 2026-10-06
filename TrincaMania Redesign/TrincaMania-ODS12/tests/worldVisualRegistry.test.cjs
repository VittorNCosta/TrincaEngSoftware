const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
// Metro returns an asset identifier. Retaining its resolved filename here
// verifies real files while avoiding native image decoding in Node.
require.extensions['.png'] = (module, filename) => {
  const bytes = fs.readFileSync(filename);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  module.exports = filename;
};

const { WORLDS } = require('../src/data/worlds.ts');
const { CHAPTERS } = require('../src/data/chapters.ts');
const {
  WORLD_VISUAL_ASSETS,
  getWorldVisualAssets,
  getVisualWorldId,
} = require('../src/data/worldVisualAssets.ts');
const { getResidueVisual } = require('../src/data/residueVisualAssets.ts');
const {
  RECYCLING_CARDS,
} = require('../src/domain/recycling/value-objects/RecyclingCard.ts');

test('every main world resolves its own distinct map and game files', () => {
  const images = new Set();
  for (const { id } of WORLDS.filter((world) => !world.isBonus)) {
    assert.ok(Object.hasOwn(WORLD_VISUAL_ASSETS, id), `world ${id}`);
    const assets = getWorldVisualAssets(id);
    assert.equal(assets, WORLD_VISUAL_ASSETS[id]);
    assert.equal(getVisualWorldId(id), id);
    for (const role of ['map', 'game']) {
      const filename = path.basename(assets[role]);
      assert.ok(filename.startsWith(`w${String(id).padStart(2, '0')}_`));
      assert.ok(filename.endsWith(`_${role}.png`));
      assert.ok(!images.has(assets[role]), 'another world reused this image');
      images.add(assets[role]);
    }
  }
  assert.equal(images.size, 20);
});

test('chapter art matches its family; bonus and unknown fallbacks remain explicit', () => {
  for (const chapter of CHAPTERS) {
    assert.equal(getVisualWorldId(chapter.worldId), chapter.worldId - 100);
    assert.equal(
      getWorldVisualAssets(chapter.worldId),
      getWorldVisualAssets(chapter.worldId - 100),
    );
  }
  // A-24a/A-24b are pending: this assertion documents the current placeholder.
  assert.equal(getVisualWorldId(21), 4);
  assert.equal(getWorldVisualAssets(21), WORLD_VISUAL_ASSETS[4]);
  assert.equal(getWorldVisualAssets(999), WORLD_VISUAL_ASSETS[1]);
});

test('all residue cards resolve valid artwork across campaign and chapters, leaving other roles unchanged', () => {
  const ids = [
    ...WORLDS.map((world) => world.id),
    ...CHAPTERS.map((chapter) => chapter.worldId),
  ];
  for (const worldId of ids) {
    for (const card of RECYCLING_CARDS) {
      const visual = getResidueVisual(card.id, worldId);
      if (card.role !== 'residuo') {
        assert.equal(visual, undefined);
        continue;
      }
      assert.ok(visual, `${worldId}: ${card.id}`);
      assert.ok(visual.label.trim());
      assert.ok(fs.existsSync(visual.image));
      if (worldId >= 101)
        assert.deepEqual(visual, getResidueVisual(card.id, worldId - 100));
    }
  }
  assert.equal(getResidueVisual(undefined, 1), undefined);
  assert.equal(getResidueVisual('invalid', 1), undefined);
});
