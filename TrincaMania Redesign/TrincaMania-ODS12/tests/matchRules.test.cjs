const assert = require('node:assert/strict');
const test = require('node:test');

const { registrarTypeScript } = require('./lib/typescript.cjs');

registrarTypeScript();

const {
  CARD_ROLES,
  CARD_ROLE_CYCLE,
  TRIPLE_SIZE,
  compareRolesByCycleStep,
  getCardRole,
  isCardRole,
} = require('../src/domain/recycling/value-objects/CardRole.ts');
const {
  MATERIALS,
  MATERIAL_TYPES,
  getMaterial,
  isMaterialType,
} = require('../src/domain/recycling/value-objects/MaterialType.ts');
const {
  DEFAULT_MATCH_RULE_ID,
  activeMatchRule,
  getMatchRule,
} = require('../src/domain/recycling/policies/MatchRuleRegistry.ts');
const {
  SameMaterialMatchRule,
} = require('../src/domain/recycling/policies/SameMaterialMatchRule.ts');

/**
 * A política de trinca e os dois value objects que a sustentam.
 *
 * Estes três arquivos estavam com **0% de cobertura de função** — o que é
 * estranho para o núcleo do domínio, e tem uma explicação simples: o jogo roda
 * na regra do ciclo (`RecyclingCycleMatchRule`), então a regra alternativa e os
 * ajudantes dos value objects nunca eram chamados por teste nenhum. Código de
 * domínio que ninguém executa é código que ninguém sabe se ainda funciona; a
 * hora de descobrir não é quando alguém trocar a regra ativa.
 *
 * A parte de conteúdo aqui não é decorativa. As cores das lixeiras vêm da
 * resolução CONAMA 275/2001 e são literalmente o que o jogo ensina (ODS 12) —
 * uma lixeira azul de plástico seria exatamente o erro que a partida tenta
 * corrigir no jogador.
 */

const peca = (id, kind, role) => ({ id, kind, role });

test('a regra alternativa fecha com três resíduos do mesmo material, sem exigir o ciclo', () => {
  assert.deepEqual(SameMaterialMatchRule.buildTripleRoles(), [
    'residuo',
    'residuo',
    'residuo',
  ]);

  const bandeja = [
    peca('a', 'plastico', 'residuo'),
    peca('b', 'plastico', 'lixeira'),
    peca('c', 'plastico', 'simbolo'),
  ];

  // Os papéis são ignorados de propósito: o que importa é o material.
  const trinca = SameMaterialMatchRule.findCompletedTriple(bandeja);
  assert.deepEqual(
    trinca.map((tile) => tile.id),
    ['a', 'b', 'c'],
  );
});

test('a regra alternativa devolve as peças na ordem da bandeja, não na ordem do agrupamento', () => {
  // Intercalado de propósito: quem remove as peças conta com a ordem da
  // bandeja para animar a saída, e um agrupamento interno não pode vazar essa
  // ordem para fora.
  const bandeja = [
    peca('p1', 'plastico', 'residuo'),
    peca('v1', 'vidro', 'residuo'),
    peca('p2', 'plastico', 'residuo'),
    peca('v2', 'vidro', 'lixeira'),
    peca('p3', 'plastico', 'simbolo'),
  ];

  const trinca = SameMaterialMatchRule.findCompletedTriple(bandeja);
  assert.deepEqual(
    trinca.map((tile) => tile.id),
    ['p1', 'p2', 'p3'],
  );
});

test('a regra alternativa não fecha com dois do mesmo material nem com três materiais diferentes', () => {
  assert.equal(
    SameMaterialMatchRule.findCompletedTriple([
      peca('a', 'papel', 'residuo'),
      peca('b', 'papel', 'lixeira'),
    ]),
    undefined,
  );

  assert.equal(
    SameMaterialMatchRule.findCompletedTriple([
      peca('a', 'papel', 'residuo'),
      peca('b', 'vidro', 'residuo'),
      peca('c', 'metal', 'residuo'),
    ]),
    undefined,
  );

  assert.equal(SameMaterialMatchRule.findCompletedTriple([]), undefined);
});

test('selectTripleFrom escolhe exatamente três candidatos de um material só', () => {
  const candidatos = [
    peca('m1', 'metal', 'residuo'),
    peca('m2', 'metal', 'lixeira'),
    peca('m3', 'metal', 'simbolo'),
    peca('m4', 'metal', 'residuo'),
  ];

  const escolha = SameMaterialMatchRule.selectTripleFrom(candidatos);
  assert.equal(escolha.length, TRIPLE_SIZE);
  assert.ok(escolha.every((tile) => tile.kind === 'metal'));

  assert.equal(
    SameMaterialMatchRule.selectTripleFrom([
      peca('o1', 'organico', 'residuo'),
      peca('o2', 'organico', 'lixeira'),
    ]),
    undefined,
  );
});

test('o registro entrega a regra do ciclo por padrão e cai nela quando o id não existe', () => {
  assert.equal(DEFAULT_MATCH_RULE_ID, 'recycling-cycle');
  assert.equal(getMatchRule().id, 'recycling-cycle');
  assert.equal(getMatchRule('same-material').id, 'same-material');

  // Id vindo de save antigo ou de config quebrada não pode derrubar a partida:
  // sem regra não existe jogo, e travar aqui é pior que jogar no modo padrão.
  assert.equal(getMatchRule('regra-que-nao-existe').id, 'recycling-cycle');
});

test('a regra ativa do jogo é o ciclo da reciclagem — trocar isso troca o jogo inteiro', () => {
  // Trava de conteúdo, não de implementação: a trinca do TrincaMania é
  // resíduo → lixeira → símbolo, e é dela que sai o sentido educativo. Se um
  // dia a regra ativa mudar, que seja com esta linha no diff.
  assert.equal(activeMatchRule.id, 'recycling-cycle');
  assert.deepEqual(activeMatchRule.buildTripleRoles(), CARD_ROLE_CYCLE);
});

test('o ciclo de papéis tem três passos, em ordem, e o comparador respeita essa ordem', () => {
  assert.equal(TRIPLE_SIZE, 3);
  assert.deepEqual(CARD_ROLE_CYCLE, ['residuo', 'lixeira', 'simbolo']);
  assert.deepEqual(
    CARD_ROLE_CYCLE.map((role) => CARD_ROLES[role].step),
    [1, 2, 3],
  );

  const embaralhado = ['simbolo', 'residuo', 'lixeira'];
  assert.deepEqual(
    [...embaralhado].sort(compareRolesByCycleStep),
    CARD_ROLE_CYCLE,
  );

  assert.equal(getCardRole('lixeira').shortLabel, 'Lixeira');
  assert.ok(isCardRole('residuo'));
  assert.ok(!isCardRole('residuos'));
});

test('os cinco materiais da coleta seletiva estão completos e com cor distinta', () => {
  assert.deepEqual(MATERIAL_TYPES, [
    'plastico',
    'papel',
    'vidro',
    'metal',
    'organico',
  ]);

  const cores = MATERIAL_TYPES.map((material) => MATERIALS[material].binColor);
  assert.equal(
    new Set(cores).size,
    MATERIAL_TYPES.length,
    'dois materiais com a mesma cor de lixeira: o jogador não teria como distinguir',
  );

  MATERIAL_TYPES.forEach((material) => {
    const definicao = getMaterial(material);
    assert.equal(definicao.id, material);
    assert.match(definicao.binColor, /^#[0-9A-F]{6}$/i);
    assert.ok(definicao.colorName.length > 0);
    // A frase de ODS 12 aparece ao fechar a trinca: é o momento em que o jogo
    // deixa de ser só encaixe e vira conteúdo.
    assert.ok(definicao.fact.length > 20);
  });

  assert.ok(isMaterialType('vidro'));
  assert.ok(!isMaterialType('isopor'));
});
