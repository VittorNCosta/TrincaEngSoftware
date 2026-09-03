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

const { BOSQUE_MAP_CONFIG } = require('../src/data/worldMapConfigs.ts');
const {
  createCampaignMapTransform,
  deriveCampaignMapLevelState,
  getCampaignMapEntityFrames,
  getCampaignMapFocusLevelId,
  getCampaignMapFrameCenter,
  getCampaignMapOpeningScrollOffset,
  getCampaignMapScrollBounds,
  resolveCampaignMapWorldSelection,
  transformCampaignMapPoint,
} = require('../src/utils/campaignMapLayout.ts');

const closeTo = (actual, expected, epsilon = 0.000001) => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `esperado ${actual} ficar a no maximo ${epsilon} de ${expected}`,
  );
};

test('transforma a cena proporcionalmente em 360, 392 e 412 pixels', () => {
  [360, 392, 412].forEach((width) => {
    const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, width);
    const expectedScale = width / 360;

    closeTo(transform.scale, expectedScale);
    closeTo(transform.width, width);
    closeTo(transform.contentHeight, 3160 * expectedScale);

    const point = transformCampaignMapPoint({ x: 180, y: 1500 }, transform);
    closeTo(point.x, width / 2);
    closeTo(point.y, 1500 * expectedScale);
  });
});

test('frame visual e toque compartilham exatamente o mesmo centro', () => {
  [360, 392, 412].forEach((width) => {
    const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, width);
    const frames = getCampaignMapEntityFrames(
      { x: 180, y: 1500 },
      { height: 20, width: 20 },
      { x: 0.5, y: 1 },
      transform,
      44,
    );
    const visualCenter = getCampaignMapFrameCenter(frames.visual);
    const touchCenter = getCampaignMapFrameCenter(frames.touch);

    closeTo(touchCenter.x, visualCenter.x);
    closeTo(touchCenter.y, visualCenter.y);
    assert.ok(frames.touch.width >= 44);
    assert.ok(frames.touch.height >= 44);
    assert.ok(frames.touch.left <= frames.visual.left);
    assert.ok(frames.touch.top <= frames.visual.top);
    assert.ok(
      frames.touch.left + frames.touch.width >=
        frames.visual.left + frames.visual.width,
    );
    assert.ok(
      frames.touch.top + frames.touch.height >=
        frames.visual.top + frames.visual.height,
    );
  });
});

test('nós usam a âncora de contato no solo sem separar arte e hitbox', () => {
  const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, 392);
  const anchor = BOSQUE_MAP_CONFIG.levelAnchors[12];
  const frames = getCampaignMapEntityFrames(
    anchor.point,
    BOSQUE_MAP_CONFIG.levelNodeSize,
    BOSQUE_MAP_CONFIG.levelNodeOrigin,
    transform,
    BOSQUE_MAP_CONFIG.minimumTouchSize,
  );
  const transformedAnchor = transformCampaignMapPoint(anchor.point, transform);

  closeTo(frames.visual.top + frames.visual.height, transformedAnchor.y);
  closeTo(
    getCampaignMapFrameCenter(frames.touch).x,
    getCampaignMapFrameCenter(frames.visual).x,
  );
  closeTo(
    getCampaignMapFrameCenter(frames.touch).y,
    getCampaignMapFrameCenter(frames.visual).y,
  );
});

test('overlap visual dos segmentos também escala proporcionalmente', () => {
  [360, 392, 412].forEach((width) => {
    const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, width);

    for (let index = 1; index < BOSQUE_MAP_CONFIG.segments.length; index += 1) {
      const previous = BOSQUE_MAP_CONFIG.segments[index - 1];
      const current = BOSQUE_MAP_CONFIG.segments[index];
      const renderedOverlap =
        (previous.top + previous.height) * transform.scale -
        current.top * transform.scale;

      closeTo(
        renderedOverlap,
        BOSQUE_MAP_CONFIG.segmentOverlap * transform.scale,
      );
    }
  });
});

test('abertura respeita HUD, começo, meio e fim nas três telas alvo', () => {
  const screens = [
    { height: 800, width: 360 },
    { height: 850, width: 392 },
    { height: 915, width: 412 },
  ];

  screens.forEach(({ height, width }) => {
    const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, width);
    const bounds = getCampaignMapScrollBounds(transform.contentHeight, height);
    const openingFor = (levelIndex) =>
      getCampaignMapOpeningScrollOffset({
        contentHeight: transform.contentHeight,
        fixedBottomInset: BOSQUE_MAP_CONFIG.openingInsets.bottom,
        fixedTopInset: BOSQUE_MAP_CONFIG.openingInsets.top,
        focusRatio: BOSQUE_MAP_CONFIG.openingFocusRatio,
        focusY:
          BOSQUE_MAP_CONFIG.levelAnchors[levelIndex].point.y * transform.scale,
        viewportHeight: height,
      });

    closeTo(openingFor(0), bounds.maximum);
    closeTo(openingFor(24), bounds.minimum);
    assert.ok(openingFor(12) > bounds.minimum);
    assert.ok(openingFor(12) < bounds.maximum);
    closeTo(openingFor(12), openingFor(12));
  });
});

test('primeira fase e conjunto final permanecem fora dos overlays fixos', () => {
  const transform = createCampaignMapTransform(BOSQUE_MAP_CONFIG, 360);
  const firstFrames = getCampaignMapEntityFrames(
    BOSQUE_MAP_CONFIG.levelAnchors[0].point,
    BOSQUE_MAP_CONFIG.levelNodeSize,
    BOSQUE_MAP_CONFIG.levelNodeOrigin,
    transform,
    BOSQUE_MAP_CONFIG.minimumTouchSize,
  );
  const finalFrames = getCampaignMapEntityFrames(
    BOSQUE_MAP_CONFIG.levelAnchors[24].point,
    BOSQUE_MAP_CONFIG.levelNodeSize,
    BOSQUE_MAP_CONFIG.levelNodeOrigin,
    transform,
    BOSQUE_MAP_CONFIG.minimumTouchSize,
  );
  const finalLandmarks = BOSQUE_MAP_CONFIG.landmarks.filter(
    ({ afterLevelId }) => afterLevelId === 'w1-025',
  );

  assert.ok(
    firstFrames.visual.top + firstFrames.visual.height <=
      transform.contentHeight - BOSQUE_MAP_CONFIG.openingInsets.bottom,
  );
  assert.ok(finalFrames.visual.top >= BOSQUE_MAP_CONFIG.openingInsets.top);
  finalLandmarks.forEach((landmark) => {
    const frames = getCampaignMapEntityFrames(
      landmark.point,
      landmark.visualSize,
      landmark.origin,
      transform,
      BOSQUE_MAP_CONFIG.minimumTouchSize,
    );
    assert.ok(frames.visual.top >= BOSQUE_MAP_CONFIG.openingInsets.top);
  });
});

test('conteúdo menor que a viewport possui scroll e abertura zerados', () => {
  assert.deepEqual(getCampaignMapScrollBounds(500, 800), {
    maximum: 0,
    minimum: 0,
  });
  assert.equal(
    getCampaignMapOpeningScrollOffset({
      contentHeight: 500,
      fixedTopInset: 160,
      focusRatio: 0.45,
      focusY: 450,
      viewportHeight: 800,
    }),
    0,
  );
});

test('foco preserva primeira desbloqueada incompleta e final do mundo concluído', () => {
  const levelIds = BOSQUE_MAP_CONFIG.levelAnchors.map(({ levelId }) => levelId);

  assert.equal(
    getCampaignMapFocusLevelId(levelIds, {
      completedLevelIds: levelIds.slice(0, 8),
      unlockedLevelIds: levelIds.slice(0, 9),
    }),
    'w1-009',
  );
  assert.equal(
    getCampaignMapFocusLevelId(levelIds, {
      completedLevelIds: levelIds,
      unlockedLevelIds: levelIds,
    }),
    'w1-025',
  );
  assert.equal(
    getCampaignMapFocusLevelId(levelIds, {
      completedLevelIds: [],
      unlockedLevelIds: [],
    }),
    'w1-001',
  );
});

test('estado de fase mantém precedência completed, locked, current e available', () => {
  const progress = {
    completedLevelIds: ['done'],
    unlockedLevelIds: ['done', 'current', 'available'],
  };

  assert.equal(
    deriveCampaignMapLevelState('done', 'done', progress),
    'completed',
  );
  assert.equal(
    deriveCampaignMapLevelState('locked', 'locked', progress),
    'locked',
  );
  assert.equal(
    deriveCampaignMapLevelState('current', 'current', progress),
    'current',
  );
  assert.equal(
    deriveCampaignMapLevelState('available', 'current', progress),
    'available',
  );
});

test('seleção rejeita mundo bloqueado sem perder um fallback desbloqueado', () => {
  assert.equal(resolveCampaignMapWorldSelection(2, 1, [1]), 1);
  assert.equal(resolveCampaignMapWorldSelection(2, 1, [1, 2]), 2);
  assert.equal(resolveCampaignMapWorldSelection(undefined, 2, [1, 2]), 2);
});

test('entradas geométricas inválidas falham sem produzir NaN', () => {
  assert.throws(
    () => createCampaignMapTransform(BOSQUE_MAP_CONFIG, 0),
    /availableWidth must be a positive finite number/,
  );
  assert.throws(
    () => getCampaignMapScrollBounds(Number.NaN, 800),
    /contentHeight must be a positive finite number/,
  );
});
