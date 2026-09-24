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
  BOARD_MAX_SCALE,
  fitBoardToViewport,
  getBoardBounds,
  getRenderedTileFrame,
  hasMeaningfulViewportChange,
  isBoardFrameContained,
} = require('../src/utils/boardLayout.ts');
const { rectanglesOverlap } = require('../src/utils/gameLogic.ts');
const { LEVELS } = require('../src/data/levels.ts');

const closeTo = (actual, expected, epsilon = 0.000001) => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `esperado ${actual} ficar a no maximo ${epsilon} de ${expected}`,
  );
};

test('bounds da Fase 61 usam apenas a extensao estrutural real', () => {
  const level = LEVELS.find((candidate) => candidate.number === 61);
  assert.ok(level);
  assert.equal(level.tiles.length, 48);

  assert.deepEqual(getBoardBounds(level.tiles), {
    bottom: 300,
    height: 256,
    left: 6,
    right: 296,
    top: 44,
    width: 290,
  });
});

test('bounds incluem pecas removidas e mystery para permanecerem estaveis', () => {
  const initialTiles = [
    { x: -12, y: 20 },
    { mystery: true, revealed: false, x: 140, y: -8 },
    { removed: true, x: 88, y: 120 },
  ];
  const initialBounds = getBoardBounds(initialTiles);
  const progressedBounds = getBoardBounds([
    { ...initialTiles[0], removed: true },
    { ...initialTiles[1], revealed: true },
    initialTiles[2],
  ]);

  assert.deepEqual(progressedBounds, initialBounds);
  assert.deepEqual(initialBounds, {
    bottom: 172,
    height: 180,
    left: -12,
    right: 192,
    top: -8,
    width: 204,
  });
});

test('bounds vazios usam o canvas legado como fallback seguro', () => {
  assert.deepEqual(getBoardBounds([]), {
    bottom: 360,
    height: 360,
    left: 0,
    right: 320,
    top: 0,
    width: 320,
  });
});

test('fit responsivo da Fase 61 e uniforme nas tres larguras alvo', () => {
  const bounds = {
    bottom: 300,
    height: 256,
    left: 6,
    right: 296,
    top: 44,
    width: 290,
  };
  const cases = [
    { expectedScale: 316 / 290, viewport: { height: 400, width: 336 } },
    { expectedScale: 1.2, viewport: { height: 430, width: 368 } },
    { expectedScale: 1.2, viewport: { height: 480, width: 388 } },
  ];

  cases.forEach(({ expectedScale, viewport }) => {
    const frame = fitBoardToViewport(bounds, viewport);

    closeTo(frame.scale, expectedScale);
    closeTo(frame.width / bounds.width, frame.height / bounds.height);
    closeTo(frame.left, (viewport.width - frame.width) / 2);
    closeTo(frame.top, (viewport.height - frame.height) / 2);
    assert.equal(isBoardFrameContained(frame, viewport), true);
    assert.equal(frame.belowPreferredMinimum, false);
  });
});

test('fase pequena respeita a escala maxima e nao cria pecas exageradas', () => {
  const bounds = getBoardBounds([
    { x: 40, y: 44 },
    { x: 108, y: 44 },
    { x: 176, y: 180 },
  ]);
  const frame = fitBoardToViewport(bounds, { height: 700, width: 500 });

  assert.equal(frame.scale, BOARD_MAX_SCALE);
  assert.equal(isBoardFrameContained(frame, { height: 700, width: 500 }), true);
});

test('contencao vence a escala minima em viewport excepcionalmente pequeno', () => {
  const bounds = {
    bottom: 300,
    height: 256,
    left: 6,
    right: 296,
    top: 44,
    width: 290,
  };
  const viewport = { height: 100, width: 120 };
  const frame = fitBoardToViewport(bounds, viewport);

  closeTo(frame.scale, 80 / 256);
  assert.equal(frame.belowPreferredMinimum, true);
  assert.equal(isBoardFrameContained(frame, viewport), true);
});

test('frame renderizado preserva deslocamentos, sobreposicao e alvo de toque', () => {
  const bounds = { left: 6, top: 44 };
  const firstTile = { x: 40, y: 78 };
  const secondTile = { x: 74, y: 112 };
  const scale = 1.2;
  const first = getRenderedTileFrame(firstTile, bounds, scale, 22, 90);
  const second = getRenderedTileFrame(secondTile, bounds, scale, 22, 90);

  closeTo(second.x - first.x, (secondTile.x - firstTile.x) * scale);
  closeTo(second.y - first.y, (secondTile.y - firstTile.y) * scale);
  closeTo(first.width, 52 * scale);
  closeTo(first.height, 52 * scale);
  assert.equal(
    rectanglesOverlap(
      {
        left: firstTile.x,
        right: firstTile.x + 52,
        top: firstTile.y,
        bottom: firstTile.y + 52,
      },
      {
        left: secondTile.x,
        right: secondTile.x + 52,
        top: secondTile.y,
        bottom: secondTile.y + 52,
      },
    ),
    true,
  );
  assert.equal(
    rectanglesOverlap(
      {
        left: first.x,
        right: first.x + first.width,
        top: first.y,
        bottom: first.y + first.height,
      },
      {
        left: second.x,
        right: second.x + second.width,
        top: second.y,
        bottom: second.y + second.height,
      },
    ),
    true,
  );
});

test('mudancas subpixel nao disparam novo enquadramento', () => {
  const current = { height: 420, width: 368 };

  assert.equal(hasMeaningfulViewportChange(undefined, current), true);
  assert.equal(
    hasMeaningfulViewportChange(current, { height: 420.7, width: 368.4 }),
    false,
  );
  assert.equal(
    hasMeaningfulViewportChange(current, { height: 421, width: 368 }),
    true,
  );
  assert.equal(
    hasMeaningfulViewportChange(current, { height: 420, width: 369 }),
    true,
  );
});
