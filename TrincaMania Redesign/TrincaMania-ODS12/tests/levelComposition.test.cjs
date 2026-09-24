const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
  LEVELS,
  LEVEL_BY_ID,
  createTileGroups,
} = require('../src/data/levels.ts');
const {
  MATERIAL_TYPES,
} = require('../src/domain/recycling/value-objects/MaterialType.ts');
const { WORLDS } = require('../src/data/worlds.ts');
const { getLevelsForWorld } = require('../src/utils/worldProgress.ts');

const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

/**
 * `createTileGroups` fatiava `MATERIAL_TYPES` sem piso. Com `kindCount <= 0` o
 * `slice` devolvia lista vazia, `groups.length` virava 0 e `groups[index % 0]`
 * era `groups[NaN]` — TypeError no import do modulo, ou seja, app que nao abre.
 *
 * Nenhuma fase usa `kindCount <= 0` hoje; o teste existe porque uma constante de
 * dados errada nao pode derrubar o boot.
 */
test('createTileGroups nao quebra com kindCount <= 0', () => {
  [0, -1, -4, -5, -100].forEach((kindCount) => {
    const groups = createTileGroups(9, kindCount);

    assert.ok(
      groups.length > 0,
      `kindCount=${kindCount} produziu grupos vazios`,
    );
    assert.equal(
      groups.length,
      1,
      `kindCount=${kindCount} deveria cair para 1 material`,
    );
    assert.equal(groups[0][0], MATERIAL_TYPES[0]);
    assert.equal(
      groups.reduce((total, [, count]) => total + count, 0),
      9,
    );
  });
});

test('createTileGroups sempre devolve ciclos fechados e o total pedido de pecas', () => {
  [9, 12, 21, 45, 60].forEach((tileCount) => {
    [-2, 0, 1, 2, 3, 5, 8, 99].forEach((kindCount) => {
      const groups = createTileGroups(tileCount, kindCount);

      assert.ok(groups.length >= 1);
      assert.ok(groups.length <= MATERIAL_TYPES.length);
      assert.equal(
        groups.reduce((total, [, count]) => total + count, 0),
        tileCount,
      );
      groups.forEach(([, count]) =>
        assert.equal(count % 3, 0, 'contagem tem de ser multipla de 3'),
      );
    });
  });
});

/**
 * Golden gerado com o `levels.ts` ANTERIOR ao clamp. O clamp so pode mudar o
 * comportamento de `kindCount <= 0`; para a faixa 3..8 usada pelas fases reais
 * a saida tem de continuar identica.
 */
test('o clamp nao altera a saida para os kindCount reais (3..8)', () => {
  const GOLDEN_PRE_CLAMP = {
    9: {
      3: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
      4: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
      5: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
      6: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
      7: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
      8: [
        ['plastico', 3],
        ['papel', 3],
        ['vidro', 3],
      ],
    },
    21: {
      3: [
        ['plastico', 9],
        ['papel', 6],
        ['vidro', 6],
      ],
      4: [
        ['plastico', 6],
        ['papel', 6],
        ['vidro', 6],
        ['metal', 3],
      ],
      5: [
        ['plastico', 6],
        ['papel', 6],
        ['vidro', 3],
        ['metal', 3],
        ['organico', 3],
      ],
      6: [
        ['plastico', 6],
        ['papel', 6],
        ['vidro', 3],
        ['metal', 3],
        ['organico', 3],
      ],
      7: [
        ['plastico', 6],
        ['papel', 6],
        ['vidro', 3],
        ['metal', 3],
        ['organico', 3],
      ],
      8: [
        ['plastico', 6],
        ['papel', 6],
        ['vidro', 3],
        ['metal', 3],
        ['organico', 3],
      ],
    },
    60: {
      3: [
        ['plastico', 21],
        ['papel', 21],
        ['vidro', 18],
      ],
      4: [
        ['plastico', 15],
        ['papel', 15],
        ['vidro', 15],
        ['metal', 15],
      ],
      5: [
        ['plastico', 12],
        ['papel', 12],
        ['vidro', 12],
        ['metal', 12],
        ['organico', 12],
      ],
      6: [
        ['plastico', 12],
        ['papel', 12],
        ['vidro', 12],
        ['metal', 12],
        ['organico', 12],
      ],
      7: [
        ['plastico', 12],
        ['papel', 12],
        ['vidro', 12],
        ['metal', 12],
        ['organico', 12],
      ],
      8: [
        ['plastico', 12],
        ['papel', 12],
        ['vidro', 12],
        ['metal', 12],
        ['organico', 12],
      ],
    },
  };

  Object.entries(GOLDEN_PRE_CLAMP).forEach(([tileCount, byKind]) => {
    Object.entries(byKind).forEach(([kindCount, expected]) => {
      assert.deepEqual(
        createTileGroups(Number(tileCount), Number(kindCount)),
        expected,
        `tileCount=${tileCount} kindCount=${kindCount}`,
      );
    });
  });
});

/**
 * Trava de integridade: as 103 fases canonicas (100 principais + 3 bonus) sao
 * dados de producao. Qualquer mudanca em `levels.ts` que altere UMA peca
 * quebra este hash de proposito.
 */
test('as 103 fases canonicas continuam byte-identicas', () => {
  assert.equal(LEVELS.length, 103);
  assert.equal(
    LEVELS.reduce((total, level) => total + level.tiles.length, 0),
    4668,
  );
  assert.equal(
    sha256(JSON.stringify(LEVELS)),
    '55e70bd5a6905155058d9a0bae4236911cc208401b2d35504a1e24ec0fadc4ce',
  );
});

test('LEVEL_BY_ID indexa exatamente as fases de LEVELS', () => {
  assert.equal(LEVEL_BY_ID.size, LEVELS.length);
  LEVELS.forEach((level) => assert.equal(LEVEL_BY_ID.get(level.id), level));
  assert.equal(LEVEL_BY_ID.get('nao-existe'), undefined);
});

/**
 * `getLevelsForWorld` passou a memoizar por mundo. A lista e estatica, entao o
 * conteudo tem de continuar o mesmo e as chamadas seguintes tem de bater com a
 * primeira.
 */
test('getLevelsForWorld memoizado devolve as fases certas de cada mundo', () => {
  WORLDS.forEach((world) => {
    const levels = getLevelsForWorld(world.id);

    assert.equal(
      levels.length,
      world.levelIds.length,
      `mundo ${world.id}: quantidade`,
    );
    assert.deepEqual(
      levels.map((level) => level.id),
      world.levelIds,
      `mundo ${world.id}: ordem e ids`,
    );
    assert.ok(
      levels.every((level) => level.worldId === world.id),
      `mundo ${world.id}: worldId`,
    );
  });
});

test('getLevelsForWorld e estavel entre chamadas e cobre as 103 fases', () => {
  WORLDS.forEach((world) => {
    const first = getLevelsForWorld(world.id);
    const second = getLevelsForWorld(world.id);

    assert.equal(
      JSON.stringify(second),
      JSON.stringify(first),
      `mundo ${world.id}: memo divergiu`,
    );
  });

  const todas = WORLDS.flatMap((world) =>
    getLevelsForWorld(world.id).map((level) => level.id),
  );

  assert.equal(todas.length, 103);
  assert.equal(new Set(todas).size, 103);
});
