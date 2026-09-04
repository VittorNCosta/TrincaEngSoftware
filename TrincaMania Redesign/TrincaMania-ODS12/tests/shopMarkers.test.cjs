const assert = require('node:assert/strict');
const test = require('node:test');

const { registrarTypeScript } = require('./lib/typescript.cjs');

registrarTypeScript();

const { LEVELS } = require('../src/data/levels.ts');
const { WORLDS, getWorldById } = require('../src/data/worlds.ts');
const { createInitialProgress } = require('../src/storage/progressStorage.ts');
const {
  REST_CHECKPOINT_COIN_REWARDS,
  SHOP_INTERVAL,
  getNextWorldLevelAfterLevel,
  getRestCheckpointCoinReward,
  isLastKnownShopMarker,
  isShopUnlockedAfterLevel,
  shouldShowShopAfterLevel,
  shouldShowWorldPortalAfterLevel,
} = require('../src/utils/shop.ts');

/**
 * Onde a loja, o descanso e o portal aparecem no mapa.
 *
 * Este arquivo estava com 20% de cobertura de função, e o que ele decide é
 * visível em toda partida: de quantas em quantas fases a loja aparece, quanto
 * paga o descanso e onde nasce o portal para o mundo seguinte.
 *
 * O motivo de cobrir agora não é só o número. O resize de 2026-09-03 mudou os
 * mundos de 25 para 10 fases, e este módulo raciocina em cima da posição da
 * fase dentro do mundo (`worldLevelNumber`, com `levelIds` como reserva). Um
 * intervalo de 5 num mundo de 25 dava 5 paradas; num mundo de 10 dá duas, e a
 * segunda caiu justo na última fase — onde o portal também aparece. Isso não é
 * defeito, mas é uma consequência do resize que ninguém tinha escrito em lugar
 * nenhum.
 */

const MUNDOS_PRINCIPAIS = WORLDS.filter((world) => !world.isBonus);
const FASE_BONUS = LEVELS.find((level) => getWorldById(level.worldId).isBonus);

test('a loja aparece de cinco em cinco fases dentro do mundo', () => {
  assert.equal(SHOP_INTERVAL, 5);

  assert.ok(shouldShowShopAfterLevel('w1-005'));
  assert.ok(shouldShowShopAfterLevel('w1-010'));
  assert.ok(!shouldShowShopAfterLevel('w1-001'));
  assert.ok(!shouldShowShopAfterLevel('w1-009'));

  // Id que não existe (save adulterado, deep link velho) não pode estourar:
  // a resposta certa é "não mostra a loja", não uma exceção no meio do mapa.
  assert.ok(!shouldShowShopAfterLevel('fase-que-nao-existe'));
});

test('cada mundo principal tem exatamente duas paradas de loja, e o mundo bônus nenhuma', () => {
  MUNDOS_PRINCIPAIS.forEach((world) => {
    const paradas = LEVELS.filter(
      (level) =>
        level.worldId === world.id && shouldShowShopAfterLevel(level.id),
    ).map((level) => level.id);

    // Dez fases por mundo, intervalo de cinco: a quinta e a décima. Se um
    // mundo passar a ter outro tamanho, este número muda junto e o teste
    // obriga a decidir de novo qual é o ritmo das paradas.
    assert.equal(
      paradas.length,
      2,
      `mundo ${world.id} tem ${paradas.length} paradas de loja: ${paradas.join(', ')}`,
    );
  });

  assert.ok(FASE_BONUS, 'a campanha não tem mundo bônus');
  assert.ok(!shouldShowShopAfterLevel(FASE_BONUS.id));
});

test('o descanso paga 15 na quinta fase e 40 na décima, e nada no meio', () => {
  assert.deepEqual(REST_CHECKPOINT_COIN_REWARDS, { 5: 15, 10: 40 });

  assert.equal(getRestCheckpointCoinReward('w1-005'), 15);
  assert.equal(getRestCheckpointCoinReward('w3-010'), 40);
  assert.equal(getRestCheckpointCoinReward('w3-007'), 0);
  assert.equal(getRestCheckpointCoinReward('fase-que-nao-existe'), 0);
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

test('só a última fase do último mundo é a última marca de loja conhecida', () => {
  const ultimoMundo = MUNDOS_PRINCIPAIS[MUNDOS_PRINCIPAIS.length - 1];
  const ultimaFase = ultimoMundo.levelIds[ultimoMundo.levelIds.length - 1];

  // É o marcador de fim de conteúdo: depois dele não há mundo para onde ir, e
  // o mapa precisa saber disso para não desenhar um portal para lugar nenhum.
  assert.ok(isLastKnownShopMarker(ultimaFase));
  assert.ok(!isLastKnownShopMarker('w1-010'));
  assert.ok(!isLastKnownShopMarker('w1-009'));
  assert.ok(!isLastKnownShopMarker(FASE_BONUS.id));
  assert.ok(!isLastKnownShopMarker('fase-que-nao-existe'));
});

test('a loja só abre depois de a fase ter sido concluída', () => {
  const progresso = createInitialProgress();

  assert.ok(!isShopUnlockedAfterLevel('w1-005', progresso));
  assert.ok(
    isShopUnlockedAfterLevel('w1-005', {
      ...progresso,
      completedLevelIds: ['w1-005'],
    }),
  );
});
