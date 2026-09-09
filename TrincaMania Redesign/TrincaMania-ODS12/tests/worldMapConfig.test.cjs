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

const { LEVELS } = require('../src/data/levels.ts');
const { WORLDS } = require('../src/data/worlds.ts');
const {
  PARQUE_LEVEL_ANCHORS,
  PARQUE_MAP_ASSET_KEYS,
  PARQUE_MAP_CONFIG,
  PARQUE_MAP_LANDMARK_VISUAL_KEYS,
  WORLD_MAP_CONFIGS,
  getWorldMapConfig,
} = require('../src/data/worldMapConfigs.ts');
const {
  createSelectedWorldMapModel,
  validateWorldMapConfig,
  validateWorldMapRegistry,
} = require('../src/utils/campaignMapLayout.ts');

const worldOne = WORLDS.find(({ id }) => id === 1);
const knownWorldIds = new Set(WORLDS.map(({ id }) => id));
const validationContext = {
  expectedLevelIds: worldOne.levelIds,
  expectedWorldId: 1,
  knownAssetKeys: new Set(PARQUE_MAP_ASSET_KEYS),
  knownLandmarkVisualKeys: new Set(PARQUE_MAP_LANDMARK_VISUAL_KEYS),
  knownWorldIds,
};

const parqueSegmentAssetFiles = {
  'parque-canopy': 'forest_00_canopy.png',
  'parque-entry': 'forest_01_entrance.png',
  'parque-grove': 'forest_02_grove.png',
  'parque-river': 'forest_03_river_ruins.png',
  'parque-sunlit': 'forest_04_sunlit_grove.png',
  'parque-gate': 'forest_05_ancient_gate.png',
  'parque-trailhead': 'forest_06_trailhead.png',
};

test('dados existentes continuam formando 103 fases canônicas sem lacunas', () => {
  const expectedCounts = new Map([
    [1, 10],
    [2, 10],
    [3, 10],
    [4, 10],
    [5, 10],
    [6, 10],
    [7, 10],
    [8, 10],
    [9, 10],
    [10, 10],
    [21, 3],
  ]);
  const levelIds = LEVELS.map(({ id }) => id);
  const configuredIds = WORLDS.flatMap(({ levelIds: ids }) => ids);

  assert.equal(LEVELS.length, 103);
  assert.equal(new Set(levelIds).size, 103);
  assert.deepEqual(new Set(levelIds), new Set(configuredIds));

  WORLDS.forEach((world) => {
    const levels = LEVELS.filter(({ worldId }) => worldId === world.id);
    assert.equal(levels.length, expectedCounts.get(world.id));
    levels.forEach((level, index) => {
      assert.equal(level.id, world.levelIds[index]);
      assert.equal(level.worldLevelNumber, index + 1);
    });
  });
});

test('Parque possui as 10 âncoras exatas e bijetivas em ordem de campanha', () => {
  const expectedPoints = [
    [190, 2945],
    [188, 2660],
    [190, 2400],
    [180, 2115],
    [200, 1765],
    [170, 1575],
    [160, 1225],
    [150, 940],
    [180, 685],
    [180, 415],
  ];

  assert.equal(PARQUE_LEVEL_ANCHORS.length, 10);
  assert.deepEqual(
    PARQUE_LEVEL_ANCHORS.map(({ levelId }) => levelId),
    worldOne.levelIds,
  );
  assert.deepEqual(
    PARQUE_LEVEL_ANCHORS.map(({ point }) => [point.x, point.y]),
    expectedPoints,
  );
  assert.equal(new Set(PARQUE_LEVEL_ANCHORS.map(({ site }) => site)).size, 5);
});

test('segmentos seguem a composição e o overlap canônico de 24 unidades', () => {
  assert.deepEqual(
    PARQUE_MAP_CONFIG.segments.map(({ height, layers, top }) => ({
      assetKey: layers[0].assetKey,
      height,
      top,
    })),
    [
      { assetKey: 'parque-canopy', height: 324, top: 0 },
      { assetKey: 'parque-gate', height: 564, top: 300 },
      { assetKey: 'parque-river', height: 564, top: 840 },
      { assetKey: 'parque-grove', height: 564, top: 1380 },
      { assetKey: 'parque-sunlit', height: 564, top: 1920 },
      { assetKey: 'parque-entry', height: 564, top: 2460 },
      { assetKey: 'parque-trailhead', height: 160, top: 3000 },
    ],
  );

  PARQUE_MAP_CONFIG.segments.slice(1).forEach((segment, index) => {
    const previous = PARQUE_MAP_CONFIG.segments[index];
    assert.equal(previous.top + previous.height - segment.top, 24);
  });

  assert.ok(
    PARQUE_MAP_CONFIG.segments.every(({ layers }) => layers.length > 0),
  );
  assert.ok(
    PARQUE_MAP_CONFIG.segments.every(({ layers }) =>
      layers.every(({ role }) =>
        ['effect', 'foreground', 'terrain'].includes(role),
      ),
    ),
  );
});

test('assets segmentados existem e respeitam o teto seguro de textura', () => {
  assert.deepEqual(
    new Set(Object.keys(parqueSegmentAssetFiles)),
    new Set(PARQUE_MAP_ASSET_KEYS),
  );

  Object.values(parqueSegmentAssetFiles).forEach((fileName) => {
    const filePath = path.join(
      __dirname,
      '..',
      'assets',
      'map',
      'world1',
      fileName,
    );
    const header = Buffer.alloc(24);
    const descriptor = fs.openSync(filePath, 'r');

    try {
      assert.equal(
        fs.readSync(descriptor, header, 0, header.length, 0),
        header.length,
      );
    } finally {
      fs.closeSync(descriptor);
    }

    assert.equal(header.subarray(1, 4).toString('ascii'), 'PNG');
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    assert.ok(width <= 768, `${fileName} excedeu 768 px de largura`);
    assert.ok(height <= 1152, `${fileName} excedeu 1152 px de altura`);
  });
});

test('descansos e portal preservam checkpoints e usam posições distintas', () => {
  const rests = PARQUE_MAP_CONFIG.landmarks.filter(
    ({ kind }) => kind === 'rest',
  );
  const portal = PARQUE_MAP_CONFIG.landmarks.find(
    ({ kind }) => kind === 'portal',
  );
  const positions = PARQUE_MAP_CONFIG.landmarks.map(
    ({ point }) => `${point.x}:${point.y}`,
  );

  assert.deepEqual(
    rests.map(({ afterLevelId }) => afterLevelId),
    ['w1-005', 'w1-010'],
  );
  assert.equal(portal.afterLevelId, 'w1-010');
  assert.equal(portal.targetWorldId, 2);
  assert.equal(new Set(positions).size, positions.length);
});

test('configuração válida do Parque não produz erros', () => {
  assert.deepEqual(
    validateWorldMapConfig(PARQUE_MAP_CONFIG, validationContext),
    [],
  );
});

test('validação inválida é determinística e denuncia a causa real', () => {
  const invalid = structuredClone(PARQUE_MAP_CONFIG);
  invalid.designSize.width = 0;
  invalid.segments[1].top = 360;
  invalid.segments[2].layers[0].assetKey = 'unknown-segment';
  invalid.segments[0].top = 1;
  invalid.segments.at(-1).height = 159;
  invalid.levelAnchors = invalid.levelAnchors.slice(0, -1);
  invalid.levelAnchors[0].point = { ...invalid.levelAnchors[0].point, x: -1 };
  invalid.landmarks[0].afterLevelId = 'w1-999';
  invalid.landmarks[1].visualKey = 'missing-rest-renderer';
  invalid.segments[0].layers[0].role = 'unknown-role';

  const first = validateWorldMapConfig(invalid, validationContext);
  const second = validateWorldMapConfig(invalid, validationContext);

  assert.deepEqual(second, first);
  assert.ok(first.includes('designSize.width:must-be-positive-finite'));
  assert.ok(first.includes('segments[1]:segment-gap'));
  assert.ok(first.includes('segments[1]:overlap-must-equal-24'));
  assert.ok(first.includes('segments[2].layers[0].assetKey:unknown'));
  assert.ok(first.includes('segments:first-must-start-at-zero'));
  assert.ok(first.includes('segments:last-must-end-at-design-height'));
  assert.ok(first.includes('levelAnchors[0].point.x:out-of-bounds'));
  assert.ok(first.includes('levelAnchors:missing-w1-010'));
  assert.ok(first.includes('road:must-contain-entry-levels-and-exit'));
  assert.ok(first.includes('road:level-point-mismatch-w1-001'));
  assert.ok(first.includes('landmarks[0].afterLevelId:unknown'));
  assert.ok(first.includes('landmarks[1].visualKey:unknown'));
  assert.ok(first.includes('segments[0].layers[0].role:unknown'));
});

test('duplicatas e referências ausentes também são rejeitadas', () => {
  const invalid = structuredClone(PARQUE_MAP_CONFIG);
  invalid.levelAnchors[1].levelId = invalid.levelAnchors[0].levelId;
  invalid.landmarks[1].id = invalid.landmarks[0].id;
  const portal = invalid.landmarks.find(({ kind }) => kind === 'portal');
  delete portal.targetWorldId;

  const errors = validateWorldMapConfig(invalid, validationContext);

  assert.ok(errors.includes('levelAnchors[1].levelId:duplicate'));
  assert.ok(errors.includes('landmarks[1].id:duplicate'));
  assert.ok(errors.includes('landmarks[2].targetWorldId:required-for-portal'));
});

test('todos os mundos têm modo explícito e nenhum usa fallback visual do Parque', () => {
  const worldIds = WORLDS.map(({ id }) => id);

  assert.deepEqual(validateWorldMapRegistry(WORLD_MAP_CONFIGS, worldIds), []);
  assert.equal(getWorldMapConfig(1).mode, 'segmented');

  const legacyConfigs = worldIds
    .slice(1)
    .map((worldId) => getWorldMapConfig(worldId));
  legacyConfigs.forEach((config, index) => {
    assert.equal(config.mode, 'legacy');
    assert.equal(config.worldId, worldIds[index + 1]);
    assert.equal(config.rendererKey, `legacy-world-${worldIds[index + 1]}`);
    assert.notEqual(config.identityKey, PARQUE_MAP_CONFIG.identityKey);
  });
  assert.equal(getWorldMapConfig(999), undefined);
});

test('modelo de render contém somente níveis e segmentos do mundo escolhido', () => {
  const parque = createSelectedWorldMapModel(1, WORLD_MAP_CONFIGS, LEVELS);
  const vales = createSelectedWorldMapModel(2, WORLD_MAP_CONFIGS, LEVELS);
  const bonus = createSelectedWorldMapModel(21, WORLD_MAP_CONFIGS, LEVELS);

  assert.equal(parque.levels.length, 10);
  assert.ok(parque.levels.every(({ worldId }) => worldId === 1));
  assert.equal(parque.segments.length, 7);

  assert.equal(vales.levels.length, 10);
  assert.ok(vales.levels.every(({ worldId }) => worldId === 2));
  assert.deepEqual(vales.segments, []);

  assert.equal(bonus.levels.length, 3);
  assert.ok(bonus.levels.every(({ worldId }) => worldId === 21));
  assert.deepEqual(bonus.segments, []);
});

test('registry incompleto ou cruzado falha sem cair silenciosamente no mundo 1', () => {
  const missing = { ...WORLD_MAP_CONFIGS };
  delete missing[2];
  assert.deepEqual(validateWorldMapRegistry(missing, [1, 2]), [
    'registry:2:missing',
  ]);

  const crossed = {
    ...WORLD_MAP_CONFIGS,
    2: { ...WORLD_MAP_CONFIGS[2], worldId: 3 },
  };
  assert.deepEqual(validateWorldMapRegistry(crossed, [2]), [
    'registry:2:worldId-mismatch',
  ]);
});
