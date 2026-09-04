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
  CHAPTERS,
  CHAPTER_COUNT,
  CHAPTER_LEVELS,
  CHAPTER_MAPS_PER_CHAPTER,
  CHAPTER_MAX_SUPPORTED_TILE_COUNT,
  buildChapterLevel,
  getChapterDifficultyRank,
  getChapterLevelSummaries,
  getChapterLevelSummary,
  validateChapters,
} = require('../src/data/chapters.ts');
const {
  buildChapterMapId,
  getChapterVisualIdentity,
  getChapterVisualSignature,
  CHAPTER_ART_SEGMENT_KEYS,
} = require('../src/data/chapterVisualIdentity.ts');
const {
  AUTHORED_TILE_POSITIONS,
  MAX_TILE_POSITIONS,
  getTilePosition,
  takeTilePositions,
} = require('../src/data/boardPositions.ts');
const { LEVELS } = require('../src/data/levels.ts');
const { WORLDS } = require('../src/data/worlds.ts');
const {
  CHAPTER_WORLD_IDS,
  WORLD_MAP_CONFIGS,
} = require('../src/data/worldMapConfigs.ts');
const {
  validateWorldMapRegistry,
} = require('../src/utils/campaignMapLayout.ts');
const {
  getTileRect,
  isDrawnAbove,
  rectanglesOverlap,
} = require('../src/utils/gameLogic.ts');
const {
  MATERIAL_TYPES,
} = require('../src/domain/recycling/value-objects/MaterialType.ts');

const TRIPLE_SIZE = 3;

/**
 * Simula a limpeza completa do tabuleiro pela contagem de bloqueadores.
 *
 * É a métrica de alcançabilidade que valida saída procedural: se sobrar
 * qualquer peça inalcançável, a fase é invencível e o número devolvido fica
 * abaixo do total.
 */
const countRemovableTiles = (tiles) => {
  const total = tiles.length;
  const unlocks = Array.from({ length: total }, () => []);
  const blockerCounts = new Array(total).fill(0);

  for (let index = 0; index < total; index += 1) {
    for (let otherIndex = 0; otherIndex < total; otherIndex += 1) {
      if (
        index !== otherIndex &&
        isDrawnAbove(tiles[otherIndex], otherIndex, tiles[index], index) &&
        rectanglesOverlap(
          getTileRect(tiles[index]),
          getTileRect(tiles[otherIndex]),
        )
      ) {
        unlocks[otherIndex].push(index);
        blockerCounts[index] += 1;
      }
    }
  }

  const free = [];
  blockerCounts.forEach((count, index) => {
    if (count === 0) {
      free.push(index);
    }
  });

  let removed = 0;

  while (free.length > 0) {
    const index = free.pop();
    removed += 1;

    unlocks[index].forEach((blockedIndex) => {
      blockerCounts[blockedIndex] -= 1;

      if (blockerCounts[blockedIndex] === 0) {
        free.push(blockedIndex);
      }
    });
  }

  return removed;
};

test('são exatamente 10 capítulos de 100 mapas, com ids únicos e sem lacunas', () => {
  assert.equal(CHAPTER_COUNT, 10);
  assert.equal(CHAPTER_MAPS_PER_CHAPTER, 100);
  assert.equal(CHAPTERS.length, 10);
  assert.equal(CHAPTER_LEVELS.length, 1000);

  const ids = CHAPTER_LEVELS.map(({ id }) => id);
  assert.equal(new Set(ids).size, 1000);

  CHAPTERS.forEach((chapter) => {
    const summaries = getChapterLevelSummaries(chapter.id);

    assert.equal(summaries.length, 100);
    assert.deepEqual(
      summaries.map(({ id }) => id),
      chapter.levelIds,
    );

    summaries.forEach((summary, index) => {
      assert.equal(summary.chapterMapNumber, index + 1);
      assert.equal(summary.id, buildChapterMapId(chapter.id, index + 1));
      assert.equal(
        summary.campaignPosition,
        (chapter.id - 1) * 100 + index + 1,
      );
      assert.equal(getChapterLevelSummary(summary.id), summary);
    });
  });

  assert.deepEqual(
    CHAPTER_LEVELS.map(({ campaignPosition }) => campaignPosition),
    Array.from({ length: 1000 }, (_, index) => index + 1),
  );
});

test('cada capítulo declara identidade temática própria em português', () => {
  const names = CHAPTERS.map(({ name }) => name);
  const themes = CHAPTERS.map(({ theme }) => theme);

  assert.equal(new Set(names).size, 10);
  assert.equal(new Set(themes).size, 10);
  assert.deepEqual(
    CHAPTERS.map(({ id }) => id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );

  CHAPTERS.forEach((chapter) => {
    assert.ok(chapter.name.length > 0);
    assert.ok(chapter.subtitle.length > 0);
    assert.ok(chapter.lockedText.length > 0);
    assert.ok(
      MATERIAL_TYPES.includes(chapter.focusMaterial),
      `capítulo ${chapter.id}: material de destaque desconhecido`,
    );
  });
});

test('todo tileCount é múltiplo de 3 e cabe nas posições disponíveis', () => {
  CHAPTER_LEVELS.forEach((summary) => {
    // Um tileCount que não é múltiplo de 3 deixa um ciclo pela metade — a fase
    // fica invencível por construção, e nenhum ajuste de tempo salva.
    assert.equal(
      summary.tileCount % TRIPLE_SIZE,
      0,
      `${summary.id}: tileCount ${summary.tileCount} não é múltiplo de 3`,
    );
    assert.ok(
      summary.tileCount >= TRIPLE_SIZE,
      `${summary.id}: tileCount pequeno demais`,
    );
    assert.ok(
      summary.tileCount <= CHAPTER_MAX_SUPPORTED_TILE_COUNT,
      `${summary.id}: tileCount ${summary.tileCount} excede ${CHAPTER_MAX_SUPPORTED_TILE_COUNT} posições`,
    );

    const positions = takeTilePositions(summary.tileCount);
    assert.equal(positions.length, summary.tileCount);
    assert.equal(
      new Set(positions.map((position) => position.join(':'))).size,
      summary.tileCount,
      `${summary.id}: posições repetidas no tabuleiro`,
    );
  });
});

test('threeStars é sempre menor que twoStars nos 1000 mapas', () => {
  CHAPTER_LEVELS.forEach(({ id, starTimeLimits }) => {
    assert.ok(
      starTimeLimits.threeStars < starTimeLimits.twoStars,
      `${id}: threeStars ${starTimeLimits.threeStars} não é menor que twoStars ${starTimeLimits.twoStars}`,
    );
    assert.ok(Number.isInteger(starTimeLimits.threeStars));
    assert.ok(Number.isInteger(starTimeLimits.twoStars));
    assert.ok(starTimeLimits.threeStars > 0);
  });
});

/**
 * `score` do primeiro mapa de cada capítulo é exatamente
 * `(chapterId - 1) / 9 * 0.6`, sem nada da curva interna somado. Em dois
 * capítulos essa conta cai em cima de uma fronteira de faixa, e em binário ela
 * cai *por baixo*: 0.9999999999999999 no capítulo 4 e 1.9999999999999998 no 7.
 * Sem folga o `Math.floor` derrubava os dois uma faixa, e o primeiro mapa do
 * capítulo 4 anunciava `easy` sendo `normal`.
 *
 * O teste fixa as cinco faixas de abertura porque é o rótulo que o jogador lê
 * antes de encarar o mapa — a carga do tabuleiro nunca esteve errada.
 */
test('o primeiro mapa de cada capítulo não cai de faixa por arredondamento binário', () => {
  const esperado = {
    1: 'easy',
    2: 'easy',
    3: 'easy',
    4: 'normal',
    5: 'normal',
    6: 'normal',
    7: 'hard',
    8: 'hard',
    9: 'hard',
    10: 'expert',
  };

  Object.entries(esperado).forEach(([chapterId, difficulty]) => {
    const [primeiro] = getChapterLevelSummaries(Number(chapterId));

    assert.equal(
      primeiro.difficulty,
      difficulty,
      `${primeiro.id}: faixa de dificuldade do primeiro mapa mudou`,
    );
  });
});

test('a curva do capítulo é monotônica não-decrescente e realmente progride', () => {
  CHAPTERS.forEach((chapter) => {
    const summaries = getChapterLevelSummaries(chapter.id);

    summaries.slice(1).forEach((summary, index) => {
      const previous = summaries[index];

      assert.ok(
        getChapterDifficultyRank(summary.difficulty) >=
          getChapterDifficultyRank(previous.difficulty),
        `${summary.id}: dificuldade regrediu de ${previous.difficulty} para ${summary.difficulty}`,
      );
      assert.ok(
        summary.tileCount >= previous.tileCount,
        `${summary.id}: tileCount regrediu`,
      );
      assert.ok(
        summary.kindCount >= previous.kindCount,
        `${summary.id}: kindCount regrediu`,
      );
      assert.ok(
        summary.mysteryTileCount >= previous.mysteryTileCount,
        `${summary.id}: peças mistério regrediram`,
      );
    });

    const first = summaries[0];
    const last = summaries[summaries.length - 1];

    // Sem isto, "monotônico" seria satisfeito por 100 mapas idênticos.
    assert.ok(
      last.tileCount > first.tileCount,
      `capítulo ${chapter.id}: tileCount não cresce`,
    );
    assert.ok(
      last.kindCount > first.kindCount,
      `capítulo ${chapter.id}: número de materiais não cresce`,
    );
    assert.ok(
      last.mysteryTileCount > first.mysteryTileCount,
      `capítulo ${chapter.id}: peças mistério não crescem`,
    );
    assert.ok(
      getChapterDifficultyRank(last.difficulty) >
        getChapterDifficultyRank(first.difficulty),
      `capítulo ${chapter.id}: dificuldade não muda de faixa`,
    );
  });

  // As bandas também sobem entre capítulos: o capítulo 10 abre mais pesado do
  // que o capítulo 1 fecha.
  const firstChapter = getChapterLevelSummaries(1);
  const lastChapter = getChapterLevelSummaries(10);
  assert.ok(lastChapter[0].tileCount > firstChapter[99].tileCount);
});

test('marcos caem de 10 em 10 e o mapa 100 é o guardião', () => {
  CHAPTERS.forEach((chapter) => {
    const summaries = getChapterLevelSummaries(chapter.id);
    const milestones = summaries
      .filter(({ milestone }) => milestone !== undefined)
      .map(({ chapterMapNumber, milestone }) => [chapterMapNumber, milestone]);

    assert.deepEqual(milestones, [
      [10, 'rest'],
      [20, 'shop'],
      [30, 'rest'],
      [40, 'shop'],
      [50, 'rest'],
      [60, 'shop'],
      [70, 'rest'],
      [80, 'shop'],
      [90, 'rest'],
      [100, 'guardian'],
    ]);

    // O marco alivia pelo relógio, nunca derrubando a carga do tabuleiro.
    const rest = summaries[9];
    assert.ok(
      rest.starTimeLimits.threeStars > summaries[8].starTimeLimits.threeStars,
    );
    assert.ok(rest.tileCount >= summaries[8].tileCount);
  });
});

test('títulos são compostos e distintos em todo o conjunto', () => {
  const titles = CHAPTER_LEVELS.map(({ title }) => title);

  assert.equal(new Set(titles).size, 1000);

  CHAPTERS.forEach((chapter) => {
    const chapterTitles = getChapterLevelSummaries(chapter.id).map(
      ({ title }) => title,
    );
    assert.equal(new Set(chapterTitles).size, 100);
  });

  assert.ok(
    CHAPTER_LEVELS.every(({ objectiveText }) =>
      objectiveText.startsWith('Objetivo: '),
    ),
  );
  assert.equal(
    getChapterLevelSummary('ch10-100').title,
    'Guardião: Portal do Fecho',
  );
});

test('a validação automática dos capítulos não acusa nenhum problema', () => {
  assert.deepEqual(validateChapters(), []);
});

test('a identidade visual é determinística para o mesmo id', () => {
  const sampleIds = ['ch01-001', 'ch05-050', 'ch10-100', 'ch07-013'];

  sampleIds.forEach((mapId) => {
    const first = getChapterVisualIdentity(mapId);
    const second = getChapterVisualIdentity(mapId);

    assert.deepEqual(second, first);
    assert.equal(first.mapId, mapId);
    assert.ok(/^#[0-9a-f]{6}$/.test(first.baseColor));
    assert.ok(/^#[0-9a-f]{6}$/.test(first.accentColor));
    assert.ok(/^#[0-9a-f]{6}$/.test(first.backgroundColor));
    assert.ok(first.segmentKeys.length >= 3);
    assert.equal(new Set(first.segmentKeys).size, first.segmentKeys.length);
    assert.ok(
      first.segmentKeys.every((key) => CHAPTER_ART_SEGMENT_KEYS.includes(key)),
      `${mapId}: segmento fora do pool finito de arte`,
    );
  });
});

test('mapas irmãos do mesmo capítulo têm identidades visuais distintas', () => {
  const allSignatures = new Set();

  CHAPTERS.forEach((chapter) => {
    const identities = getChapterLevelSummaries(chapter.id).map(({ id }) =>
      getChapterVisualIdentity(id),
    );

    // Cor base e ordem de segmentos são as dimensões com distinção garantida
    // por construção (rotação áurea de matiz e passo coprimo de permutação).
    assert.equal(
      new Set(identities.map(({ baseColor }) => baseColor)).size,
      100,
      `capítulo ${chapter.id}: cores base colidiram entre mapas irmãos`,
    );
    assert.equal(
      new Set(identities.map(({ segmentKeys }) => segmentKeys.join('>'))).size,
      100,
      `capítulo ${chapter.id}: ordens de arte colidiram entre mapas irmãos`,
    );
    assert.equal(new Set(identities.map(({ themeKey }) => themeKey)).size, 1);

    identities.forEach((identity) =>
      allSignatures.add(getChapterVisualSignature(identity)),
    );
  });

  assert.equal(allSignatures.size, 1000);
});

/**
 * Roda nos 1000 mapas, não numa amostra.
 *
 * Geração procedural falha justamente no caso que a amostra não pegou. O custo
 * é de poucos segundos e é o que separa "1000 mapas" de "1000 mapas jogáveis".
 */
test('cada mapa de capítulo materializa um tabuleiro jogável', () => {
  CHAPTER_LEVELS.forEach(({ id: mapId }) => {
    const summary = getChapterLevelSummary(mapId);
    const level = buildChapterLevel(mapId);

    assert.ok(level, `${mapId}: não materializou`);
    assert.equal(level.id, mapId);
    assert.equal(level.worldId, summary.worldId);
    assert.equal(level.tiles.length, summary.tileCount);
    assert.equal(level.tiles.length % TRIPLE_SIZE, 0);
    assert.equal(
      new Set(level.tiles.map(({ id }) => id)).size,
      summary.tileCount,
    );

    // Alcançabilidade: nenhuma peça pode ficar presa para sempre.
    assert.equal(
      countRemovableTiles(level.tiles),
      summary.tileCount,
      `${mapId}: o tabuleiro tem peças inalcançáveis`,
    );

    // Todo material entra com o ciclo fechado: mesma contagem de resíduo,
    // lixeira e símbolo. Se desbalancear, sobra ciclo pela metade.
    const rolesByMaterial = new Map();
    level.tiles.forEach((tile) => {
      const roles = rolesByMaterial.get(tile.kind) ?? {
        lixeira: 0,
        residuo: 0,
        simbolo: 0,
      };
      roles[tile.role] += 1;
      rolesByMaterial.set(tile.kind, roles);
    });

    assert.ok(rolesByMaterial.size <= summary.kindCount);
    rolesByMaterial.forEach((roles, material) => {
      assert.equal(
        roles.residuo,
        roles.lixeira,
        `${mapId}: ${material} desbalanceado`,
      );
      assert.equal(
        roles.lixeira,
        roles.simbolo,
        `${mapId}: ${material} desbalanceado`,
      );
    });

    const mysteryCount = level.tiles.filter(({ mystery }) => mystery).length;
    assert.ok(
      mysteryCount <= summary.mysteryTileCount,
      `${mapId}: mais peças mistério do que o mapa pede`,
    );
  });
});

test('o mesmo id devolve sempre o mesmo tabuleiro', () => {
  ['ch01-001', 'ch06-042', 'ch10-100'].forEach((mapId) => {
    assert.deepEqual(buildChapterLevel(mapId), buildChapterLevel(mapId));
  });

  assert.equal(buildChapterLevel('ch11-001'), undefined);
  assert.equal(buildChapterLevel('w1-001'), undefined);
});

test('posições acima das 60 autorais existem e não sobrescrevem o layout canônico', () => {
  // O bug original: LEVEL_POSITIONS tinha 60 entradas e o índice 60 devolvia
  // undefined, estourando TypeError no import de levels.ts.
  assert.equal(AUTHORED_TILE_POSITIONS.length, 60);
  assert.ok(MAX_TILE_POSITIONS > 102);

  AUTHORED_TILE_POSITIONS.forEach((position, index) => {
    assert.deepEqual(getTilePosition(index), position);
  });

  const allPositions = takeTilePositions(MAX_TILE_POSITIONS);
  assert.equal(
    new Set(allPositions.map((position) => position.join(':'))).size,
    MAX_TILE_POSITIONS,
  );
  allPositions.forEach(([x, y, z]) => {
    assert.ok(
      Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z),
    );
    assert.ok(x >= 0 && y >= 0 && z >= 0);
  });

  // Índice fora do estoque faz clamp explícito em vez de devolver undefined.
  const beyond = getTilePosition(MAX_TILE_POSITIONS + 500);
  assert.deepEqual(beyond, allPositions[MAX_TILE_POSITIONS - 1]);
  assert.notEqual(getTilePosition(60), undefined);
});

test('cada capítulo tem entrada própria no registry de mapas, sem colisão', () => {
  assert.deepEqual(
    validateWorldMapRegistry(WORLD_MAP_CONFIGS, CHAPTER_WORLD_IDS),
    [],
  );
  assert.deepEqual(
    CHAPTERS.map(({ worldId }) => worldId),
    [...CHAPTER_WORLD_IDS],
  );

  const campaignWorldIds = new Set(WORLDS.map(({ id }) => id));
  CHAPTER_WORLD_IDS.forEach((worldId) => {
    assert.ok(
      !campaignWorldIds.has(worldId),
      `${worldId} colidiu com um mundo da campanha`,
    );
    assert.equal(WORLD_MAP_CONFIGS[worldId].worldId, worldId);
    assert.equal(WORLD_MAP_CONFIGS[worldId].mode, 'legacy');
  });

  const identityKeys = Object.values(WORLD_MAP_CONFIGS).map(
    ({ identityKey }) => identityKey,
  );
  assert.equal(new Set(identityKeys).size, identityKeys.length);
});

test('as 103 fases canônicas continuam intactas ao lado dos capítulos', () => {
  assert.equal(LEVELS.length, 103);
  assert.equal(new Set(LEVELS.map(({ id }) => id)).size, 103);
  assert.deepEqual(
    new Set(LEVELS.map(({ id }) => id)),
    new Set(WORLDS.flatMap(({ levelIds }) => levelIds)),
  );

  // Nenhum id ou mundo de capítulo pode ter vazado para a campanha canônica.
  const chapterIds = new Set(CHAPTER_LEVELS.map(({ id }) => id));
  assert.ok(LEVELS.every(({ id }) => !chapterIds.has(id)));
  assert.ok(LEVELS.every(({ worldId }) => worldId < 100));
  assert.ok(WORLDS.every(({ id }) => id < 100));
  assert.equal(WORLDS.length, 11);

  // O layout autoral não pode ter mudado com a correção das posições.
  const level61 = LEVELS.find(({ number }) => number === 61);
  assert.equal(level61.tiles.length, 48);
  assert.deepEqual(
    level61.tiles.slice(0, 3).map(({ x, y, z }) => [x, y, z]),
    [
      [40, 44, 0],
      [108, 44, 0],
      [176, 44, 0],
    ],
  );
  LEVELS.forEach((level) => {
    assert.equal(
      level.tiles.length % TRIPLE_SIZE,
      0,
      `${level.id}: fase com ciclo pela metade`,
    );
    assert.ok(level.tiles.every(({ x, y, z }) => Number.isInteger(x + y + z)));
  });
});
