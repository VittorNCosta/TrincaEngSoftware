const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

/**
 * C-27: cada mundo precisa de fundo próprio.
 * O bônus reutiliza o Viveiro até receber A-24a/b.
 * Áudio ambiente foi removido por decisão do usuário em 06/10/2026.
 */
const { WORLDS } = require('../src/data/worlds.ts');
const BONUS_WORLD_ID = 21;
const mainWorldIds = WORLDS.filter(({ id }) => id !== BONUS_WORLD_ID).map(
  ({ id }) => id,
);

require.extensions['.png'] = (module, filename) => {
  module.exports = filename;
};

const {
  getWorldVisualAssets,
  WORLD_VISUAL_ASSETS,
} = require('../src/data/worldVisualAssets.ts');

const loadGameBackground = () => {
  const filename = path.join(
    __dirname,
    '..',
    'src',
    'screens',
    'GameScreen.tsx',
  );
  const source = fs.readFileSync(filename, 'utf8');
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find(
      (entry) =>
        ts.isIdentifier(entry.name) && entry.name.text === 'getGameBackground',
    );
  assert.ok(
    declaration?.initializer,
    'GameScreen precisa resolver seu fundo por getGameBackground',
  );
  const compiled = ts.transpileModule(
    `const getGameBackground = ${declaration.initializer.getText(ast)};`,
    { compilerOptions: { target: ts.ScriptTarget.ES2020 } },
  ).outputText;
  return new Function(
    'getWorldVisualAssets',
    `${compiled}\nreturn getGameBackground;`,
  )(getWorldVisualAssets);
};

test('getGameBackground resolve o arquivo próprio de cada mundo da campanha', () => {
  const getGameBackground = loadGameBackground();
  const backgrounds = [];
  for (const worldId of mainWorldIds) {
    assert.ok(
      Object.hasOwn(WORLD_VISUAL_ASSETS, worldId),
      `Mundo ${worldId} precisa de registro explícito`,
    );
    const file = getGameBackground(worldId);
    assert.equal(file, WORLD_VISUAL_ASSETS[worldId].game);
    assert.ok(fs.existsSync(file), `Fundo do mundo ${worldId} precisa existir`);
    assert.match(
      path.basename(file),
      new RegExp(`^w${String(worldId).padStart(2, '0')}_.+_game\\.png$`),
    );
    backgrounds.push(file);
  }
  assert.equal(
    new Set(backgrounds).size,
    mainWorldIds.length,
    'Cada mundo numerado precisa de fundo próprio',
  );
});

test('getGameBackground reutiliza a família dos capítulos e o placeholder explícito do bônus', () => {
  const getGameBackground = loadGameBackground();
  for (const worldId of mainWorldIds) {
    assert.equal(
      getGameBackground(100 + worldId),
      WORLD_VISUAL_ASSETS[worldId].game,
    );
  }
  assert.equal(getGameBackground(BONUS_WORLD_ID), WORLD_VISUAL_ASSETS[4].game);
  assert.equal(getGameBackground(-1), WORLD_VISUAL_ASSETS[1].game);
});
