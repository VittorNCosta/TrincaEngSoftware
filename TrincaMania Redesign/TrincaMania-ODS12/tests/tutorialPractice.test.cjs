const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarTypeScript } = require('./lib/typescript.cjs');
registrarTypeScript();

const storageId = require.resolve('@react-native-async-storage/async-storage');
const unexpectedStorage = () => {
  throw new Error('O tutorial não deve acessar o save.');
};
require.cache[storageId] = {
  id: storageId,
  filename: storageId,
  loaded: true,
  exports: {
    __esModule: true,
    default: { getItem: unexpectedStorage, setItem: unexpectedStorage },
  },
};
const {
  createTutorialPractice,
  getTutorialPracticeAction,
  advanceTutorialPractice,
} = require('../src/utils/tutorialPractice.ts');
const {
  activeMatchRule,
} = require('../src/domain/recycling/policies/MatchRuleRegistry.ts');
const {
  getCardById,
} = require('../src/domain/recycling/value-objects/RecyclingCard.ts');
const next = (state) =>
  advanceTutorialPractice(state, getTutorialPracticeAction(state));

test('a prática forma o ciclo completo e ignora toque duplicado ou fora de ordem', () => {
  const initial = createTutorialPractice('cycle');
  assert.equal(
    advanceTutorialPractice(initial, { tileId: 'cycle-1' }),
    initial,
  );
  const first = next(initial);
  assert.equal(first.tray.length, 1);
  assert.equal(advanceTutorialPractice(first, { tileId: 'cycle-0' }), first);
  const second = next(first);
  assert.deepEqual(second.tray.map((tile) => tile.role).sort(), [
    'lixeira',
    'residuo',
  ]);
  const complete = next(second);
  assert.equal(complete.tray.length, 0);
  assert.equal(complete.board.filter((tile) => tile.removed).length, 3);
  assert.equal(getTutorialPracticeAction(complete), undefined);
  assert.equal(
    initial.board.some((tile) => tile.removed),
    false,
  );
  assert.equal(initial.tray.length, 0);
});

test('o alerta preserva um espaço livre sem completar um ciclo por acidente', () => {
  const practice = createTutorialPractice('tray');
  assert.equal(practice.tray.length, 6);
  assert.equal(activeMatchRule.findCompletedTriple(practice.tray), undefined);
});

test('trinca automática e voltar têm os mesmos efeitos da partida, apenas na prática', () => {
  const hint = next(next(createTutorialPractice('hint')));
  assert.equal(hint.tray.length, 0);
  assert.equal(hint.board.filter((tile) => tile.removed).length, 3);
  const initial = createTutorialPractice('undo');
  const undo = next(next(initial));
  assert.deepEqual(undo.board, initial.board);
  assert.equal(undo.tray.length, 0);
  assert.equal(getTutorialPracticeAction(undo), undefined);
});

test('misturar preserva o catálogo e os ciclos e pode ser repetido', () => {
  const initial = createTutorialPractice('shuffle');
  const shuffled = next(initial);
  assert.notDeepEqual(shuffled.board, initial.board);
  assert.deepEqual(
    shuffled.board.map((tile) => tile.cardId).sort(),
    initial.board.map((tile) => tile.cardId).sort(),
  );
  assert.deepEqual(shuffled, next(createTutorialPractice('shuffle')));
  for (const tile of shuffled.board) {
    const card = getCardById(tile.cardId);
    assert.equal(tile.kind, card.material);
    assert.equal(tile.role, card.role);
  }
});
