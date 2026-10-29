const assert = require('node:assert/strict');
const test = require('node:test');

const { registrarTypeScript } = require('./lib/typescript.cjs');

registrarTypeScript();

const { LEVELS } = require('../src/data/levels.ts');
const { WORLDS, getWorldById } = require('../src/data/worlds.ts');
const { WORLD_MAP_CONFIGS } = require('../src/data/worldMapConfigs.ts');
const {
  getNextWorldLevelAfterLevel,
  shouldShowWorldPortalAfterLevel,
} = require('../src/utils/shop.ts');

// Os pontos de descanso foram retirados; a passagem entre mundos permanece.
const MUNDOS_PRINCIPAIS = WORLDS.filter((world) => !world.isBonus);
const FASE_BONUS = LEVELS.find((level) => getWorldById(level.worldId).isBonus);

test('todos os mapas registrados ficam sem pontos de descanso ou paradas de loja', () => {
  for (const config of Object.values(WORLD_MAP_CONFIGS)) {
    if (config.mode !== 'segmented') continue;
    assert.ok(
      config.landmarks.every(({ kind }) => kind !== 'rest' && kind !== 'shop'),
    );
  }
});

test('o portal do mundo seguinte só nasce na última fase, e o último mundo não tem portal', () => {
  const primeiroDoMundo2 = getNextWorldLevelAfterLevel('w1-010');
  assert.ok(primeiroDoMundo2);
  assert.equal(primeiroDoMundo2.id, 'w2-001');

  assert.equal(getNextWorldLevelAfterLevel('w1-009'), undefined);
  assert.ok(shouldShowWorldPortalAfterLevel('w1-010'));
  assert.ok(!shouldShowWorldPortalAfterLevel('w1-009'));

  const ultimoMundo = MUNDOS_PRINCIPAIS[MUNDOS_PRINCIPAIS.length - 1];
  const ultimaFase = ultimoMundo.levelIds[ultimoMundo.levelIds.length - 1];
  assert.equal(getNextWorldLevelAfterLevel(ultimaFase), undefined);
  assert.ok(!shouldShowWorldPortalAfterLevel(ultimaFase));

  // O bônus não é "o próximo mundo": ele se abre por estrelas, não por
  // sequência, e um portal ali sugeriria uma ordem que não existe.
  assert.equal(getNextWorldLevelAfterLevel(FASE_BONUS.id), undefined);
});

test('a corrente de portais liga todos os mundos principais em ordem, sem buraco', () => {
  const encadeamento = MUNDOS_PRINCIPAIS.slice(0, -1).map((world) => {
    const ultimaFase = world.levelIds[world.levelIds.length - 1];
    const proxima = getNextWorldLevelAfterLevel(ultimaFase);

    return proxima ? proxima.worldId : undefined;
  });

  assert.deepEqual(
    encadeamento,
    MUNDOS_PRINCIPAIS.slice(1).map((world) => world.id),
    'o portal de algum mundo aponta para o lugar errado ou não aponta para lugar nenhum',
  );
});

test('uma fase inexistente não cria passagem ou ponto de parada', () => {
  assert.equal(getNextWorldLevelAfterLevel('fase-que-nao-existe'), undefined);
  assert.equal(shouldShowWorldPortalAfterLevel('fase-que-nao-existe'), false);
});
