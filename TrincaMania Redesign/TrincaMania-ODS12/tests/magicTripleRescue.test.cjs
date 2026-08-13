const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

// O projeto não depende de um runner/transpilador de testes. Este hook usa o
// TypeScript que já é dependência de desenvolvimento e mantém o teste isolado da
// configuração do bundle Expo.
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
  findMagicTripleMove,
  playMagicTriple,
} = require('../src/domain/recycling/services/PlayService.ts');

const TRAY_CAPACITY = 7;

// Peças lado a lado (TILE_SIZE = 52) nunca se sobrepõem: todas ficam jogáveis.
const createTile = (id, kind, role, x = 0) => ({
  cardId: `${kind}:${role}:1`,
  emoji: 'x',
  id,
  kind,
  role,
  x,
  y: 0,
  z: 0,
});

/**
 * Bandeja 6/7 — a mesma condição que acende "Quase sem espaço!" e oferece o
 * resgate grátis. Nenhum material da bandeja fecha ciclo: falta o símbolo do
 * plástico, o símbolo do papel e a lixeira do vidro.
 */
const createTrayAtRisk = () => [
  createTile('T1', 'plastico', 'residuo'),
  createTile('T2', 'plastico', 'residuo'),
  createTile('T3', 'plastico', 'lixeira'),
  createTile('T4', 'papel', 'residuo'),
  createTile('T5', 'papel', 'lixeira'),
  createTile('T6', 'vidro', 'residuo'),
];

/** Ciclo de metal completo e livre no tabuleiro — não toca na bandeja. */
const createBoardOnlyCycle = () => [
  createTile('B1', 'metal', 'residuo', 0),
  createTile('B2', 'metal', 'lixeira', 60),
  createTile('B3', 'metal', 'simbolo', 120),
];

test('com a bandeja no limite, trinca só de tabuleiro não é oferecida como resgate', () => {
  const tray = createTrayAtRisk();
  const board = createBoardOnlyCycle();

  const move = findMagicTripleMove({
    activeTrayCapacity: TRAY_CAPACITY,
    board,
    random: () => 0,
    tray,
  });

  // Antes da correção devolvia { boardTileIds: ['B1','B2','B3'], kind: 'metal',
  // trayTileIds: [] }: a bandeja continuava 6/7 e o resgate — permanente por
  // instalação — era queimado sem salvar nada.
  assert.equal(move, undefined);
});

test('bandeja folgada continua recebendo a trinca de tabuleiro que sempre recebeu', () => {
  const board = createBoardOnlyCycle();

  const roomyMove = findMagicTripleMove({
    activeTrayCapacity: 10,
    board,
    random: () => 0,
    tray: createTrayAtRisk(),
  });

  assert.deepEqual(roomyMove, {
    boardTileIds: ['B1', 'B2', 'B3'],
    kind: 'metal',
    trayTileIds: [],
  });

  // A fronteira é exatamente `tray.length >= activeTrayCapacity - 1`, a mesma
  // que acende o alerta de bandeja cheia. Com 5/7 ainda há folga.
  const belowThresholdMove = findMagicTripleMove({
    activeTrayCapacity: TRAY_CAPACITY,
    board,
    random: () => 0,
    tray: createTrayAtRisk().slice(0, 5),
  });

  assert.deepEqual(belowThresholdMove, {
    boardTileIds: ['B1', 'B2', 'B3'],
    kind: 'metal',
    trayTileIds: [],
  });
});

test('com a bandeja no limite, a trinca que esvazia a bandeja continua sendo escolhida', () => {
  const tray = createTrayAtRisk();
  // O símbolo do plástico fecha o ciclo com duas peças da bandeja.
  const board = [...createBoardOnlyCycle(), createTile('B4', 'plastico', 'simbolo', 180)];

  const move = findMagicTripleMove({
    activeTrayCapacity: TRAY_CAPACITY,
    board,
    random: () => 0,
    tray,
  });

  assert.deepEqual(move, {
    boardTileIds: ['B4'],
    kind: 'plastico',
    trayTileIds: ['T1', 'T3'],
  });

  const result = playMagicTriple(board, tray, TRAY_CAPACITY);

  assert.equal(result.removedKind, 'plastico');
  assert.equal(result.tray.length, 4);
});

test('sem trinca que salve a bandeja, a Trinca Mágica não consome a jogada', () => {
  const tray = createTrayAtRisk();
  const board = createBoardOnlyCycle();

  const result = playMagicTriple(board, tray, TRAY_CAPACITY);

  // Tabuleiro e bandeja voltam por identidade: é esse sinal que a GameScreen usa
  // para reportar o poder como indisponível em vez de gastá-lo.
  assert.equal(result.board, board);
  assert.equal(result.tray, tray);
  assert.equal(result.status, 'playing');
  assert.equal(result.removedKind, undefined);
});
