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
  countRemainingTiles,
  getUndoableMove,
  insertTileGroupedInTray,
  playTile,
  removeCompletedTriple,
} = require('../src/utils/gameLogic.ts');
const {
  activateNextTileMove,
  beginNextTileMoveGeneration,
  canQueueTilePress,
  createTileMoveQueue,
  enqueueTileMove,
  getOutstandingTileMoves,
  markActiveTileMoveConsuming,
  settleActiveTileFlight,
  settleActiveTileMove,
} = require('../src/utils/tileMoveQueue.ts');
const {
  getRoundTrayCapacity,
  mergeRoundTraySlotSnapshots,
} = require('../src/utils/roundTraySnapshot.ts');
const { LEVELS } = require('../src/data/levels.ts');
const {
  getCardVariantAt,
} = require('../src/domain/recycling/value-objects/RecyclingCard.ts');

const createMoveQueueHarness = (initialBoard, initialTray = []) => {
  const queue = createTileMoveQueue();
  const acceptedEntries = [];
  const arrivals = [];
  let activeMove;
  let board = initialBoard;
  let tray = initialTray;
  let tripleCount = 0;

  const enqueue = (tileId) => {
    const entry = enqueueTileMove(queue, tileId);
    if (entry) {
      acceptedEntries.push(entry);
    }
    return entry;
  };

  const startNext = () => {
    const entry = activateNextTileMove(queue);
    if (!entry) {
      return undefined;
    }

    const selectedTile = board.find((tile) => tile.id === entry.tileId);
    assert.ok(selectedTile, `peca ${entry.tileId} precisa existir no tabuleiro`);
    const result = playTile(board, tray, entry.tileId, 7);
    if (result.board === board && result.tray === tray) {
      settleActiveTileMove(queue, entry.token, 'cancelled');
      return undefined;
    }

    board = result.board;
    activeMove = {
      arrivalTray: insertTileGroupedInTray(tray, { ...selectedTile, removed: false }),
      entry,
      result,
    };
    return activeMove;
  };

  const settleFlight = (token, visualFinished = true) => {
    if (!activeMove || activeMove.entry.token !== token) {
      return false;
    }
    if (!settleActiveTileFlight(queue, token, visualFinished)) {
      return false;
    }

    arrivals.push(activeMove.entry.tileId);
    tray = activeMove.arrivalTray;
    if (activeMove.result.removedKind) {
      assert.equal(markActiveTileMoveConsuming(queue, token), true);
      return 'consuming';
    }

    tray = activeMove.result.tray;
    assert.ok(settleActiveTileMove(queue, token, 'completed'));
    activeMove = undefined;
    return 'completed';
  };

  const finishConsume = (token) => {
    if (!activeMove || activeMove.entry.token !== token) {
      return false;
    }
    if (!settleActiveTileMove(queue, token, 'completed')) {
      return false;
    }

    tray = activeMove.result.tray;
    tripleCount += 1;
    activeMove = undefined;
    return true;
  };

  const settleFlightAndConsume = (move, visualFinished = true) => {
    const outcome = settleFlight(move.entry.token, visualFinished);
    if (outcome === 'consuming') {
      assert.equal(finishConsume(move.entry.token), true);
    }
    return outcome;
  };

  return {
    acceptedEntries,
    arrivals,
    enqueue,
    finishConsume,
    get activeMove() {
      return activeMove;
    },
    get board() {
      return board;
    },
    get queue() {
      return queue;
    },
    get tray() {
      return tray;
    },
    get tripleCount() {
      return tripleCount;
    },
    settleFlight,
    settleFlightAndConsume,
    startNext,
  };
};

const assertEveryAcceptedMoveSettled = (harness) => {
  assert.equal(getOutstandingTileMoves(harness.queue).length, 0);
  harness.acceptedEntries.forEach((entry) => {
    assert.ok(
      entry.stage === 'completed' || entry.stage === 'cancelled',
      `${entry.token} terminou em ${entry.stage}`,
    );
  });
};

// Na versão ODS 12 a peça é (material, papel). O papel padrão é `residuo`
// porque a maioria dos casos aqui só precisa de peças que NÃO fecham trinca:
// três resíduos do mesmo material não formam ciclo, então o padrão mantém
// intacta a intenção original dos testes de fila e bloqueio.
const makeTile = (id, kind, x, z = 0, role = 'residuo') => {
  const card = getCardVariantAt(kind, role, 0);

  return {
    cardId: card.id,
    emoji: card.emoji,
    id,
    kind,
    role,
    x,
    y: 0,
    z,
  };
};

/** Atalho para montar o ciclo completo de um material. */
const makeCycle = (idPrefix, kind, startX) => [
  makeTile(`${idPrefix}-residuo`, kind, startX, 0, 'residuo'),
  makeTile(`${idPrefix}-lixeira`, kind, startX + 60, 0, 'lixeira'),
  makeTile(`${idPrefix}-simbolo`, kind, startX + 120, 0, 'simbolo'),
];

test('fase 64 mantém os dados de campanha esperados', () => {
  const level = LEVELS.find((candidate) => candidate.number === 64);

  assert.ok(level);
  assert.equal(level.worldId, 7);
  assert.equal(level.worldLevelNumber, 4);
  assert.equal(level.tiles.length, 51);
  assert.equal(new Set(level.tiles.map((tile) => tile.id)).size, level.tiles.length);
});

test('o ciclo do plástico entra uma vez e reduz 54 peças para 51', () => {
  let board = [
    ...makeCycle('plastico', 'plastico', 0),
    // Resíduos de papel nunca fecham ciclo entre si — é o que garante que só a
    // trinca sob teste seja consumida.
    ...Array.from({ length: 51 }, (_, index) =>
      makeTile(`filler-${index + 1}`, 'papel', 180 + index * 60),
    ),
  ];
  let tray = [];

  const first = playTile(board, tray, 'plastico-residuo', 7);
  board = first.board;
  tray = first.tray;
  assert.equal(countRemainingTiles(board), 53);
  assert.deepEqual(tray.map((tile) => tile.id), ['plastico-residuo']);
  assert.equal(first.removedKind, undefined);

  const duplicate = playTile(board, tray, 'plastico-residuo', 7);
  assert.equal(duplicate.board, board);
  assert.equal(duplicate.tray, tray);
  assert.equal(countRemainingTiles(duplicate.board), 53);

  const second = playTile(board, tray, 'plastico-lixeira', 7);
  board = second.board;
  tray = second.tray;
  assert.equal(countRemainingTiles(board), 52);
  assert.deepEqual(tray.map((tile) => tile.id), [
    'plastico-residuo',
    'plastico-lixeira',
  ]);
  assert.equal(second.removedKind, undefined);

  const third = playTile(board, tray, 'plastico-simbolo', 7);
  assert.equal(countRemainingTiles(third.board), 51);
  assert.equal(third.removedKind, 'plastico');
  assert.deepEqual(third.tray, []);
  assert.deepEqual(third.removedTileIds.sort(), [
    'plastico-lixeira',
    'plastico-residuo',
    'plastico-simbolo',
  ]);
  assert.equal(third.status, 'playing');
});

test('três resíduos do mesmo material não fecham trinca', () => {
  const board = [
    makeTile('vidro-1', 'vidro', 0),
    makeTile('vidro-2', 'vidro', 60),
    makeTile('vidro-3', 'vidro', 120),
  ];
  let tray = [];

  const result = ['vidro-1', 'vidro-2', 'vidro-3'].reduce(
    (state, tileId) => {
      const next = playTile(state.board, state.tray, tileId, 7);
      return { board: next.board, removedKind: next.removedKind, tray: next.tray };
    },
    { board, removedKind: undefined, tray },
  );

  assert.equal(result.removedKind, undefined);
  assert.equal(result.tray.length, 3);
});

test('inserção agrupa por material e ordena pelo ciclo', () => {
  const plasticoResiduo = makeTile('plastico-residuo', 'plastico', 0);
  const papelResiduo = makeTile('papel-residuo', 'papel', 60);
  const plasticoLixeira = makeTile('plastico-lixeira', 'plastico', 120, 0, 'lixeira');

  const result = insertTileGroupedInTray(
    [plasticoResiduo, papelResiduo],
    plasticoLixeira,
  );

  assert.deepEqual(result.map((tile) => tile.id), [
    'plastico-residuo',
    'plastico-lixeira',
    'papel-residuo',
  ]);
  assert.equal(result.filter((tile) => tile.id === plasticoLixeira.id).length, 1);
});

test('inserção coloca o resíduo antes da lixeira já na bandeja', () => {
  const plasticoLixeira = makeTile('plastico-lixeira', 'plastico', 0, 0, 'lixeira');
  const plasticoResiduo = makeTile('plastico-residuo', 'plastico', 60);

  const result = insertTileGroupedInTray([plasticoLixeira], plasticoResiduo);

  assert.deepEqual(result.map((tile) => tile.id), [
    'plastico-residuo',
    'plastico-lixeira',
  ]);
});

test('remoção de trinca elimina exatamente três peças e preserva excedentes', () => {
  const tray = [
    makeTile('plastico-residuo-1', 'plastico', 0),
    makeTile('plastico-residuo-2', 'plastico', 60),
    makeTile('plastico-lixeira', 'plastico', 120, 0, 'lixeira'),
    makeTile('plastico-simbolo', 'plastico', 180, 0, 'simbolo'),
    makeTile('papel-residuo', 'papel', 240),
  ];

  const result = removeCompletedTriple(tray, 'plastico');

  // Sai um de cada papel; o resíduo excedente do mesmo material permanece.
  assert.deepEqual(result.map((tile) => tile.id), [
    'plastico-residuo-2',
    'papel-residuo',
  ]);
  assert.equal(result.length, 2);
});

test('trinca formada perto de 7/7 libera espaço sem declarar derrota', () => {
  const incomingSimbolo = makeTile('plastico-board', 'plastico', 0, 0, 'simbolo');
  const tray = [
    makeTile('plastico-residuo', 'plastico', 60),
    makeTile('plastico-lixeira', 'plastico', 120, 0, 'lixeira'),
    makeTile('papel-1', 'papel', 180),
    makeTile('metal-1', 'metal', 240),
    makeTile('organico-1', 'organico', 300),
    makeTile('vidro-1', 'vidro', 360),
  ];

  const result = playTile(
    [incomingSimbolo, makeTile('remaining', 'papel', 420)],
    tray,
    incomingSimbolo.id,
    7,
  );

  assert.equal(result.status, 'playing');
  assert.equal(result.removedKind, 'plastico');
  assert.equal(result.tray.length, 4);
  assert.equal(result.tray.some((tile) => tile.kind === 'plastico'), false);
});

test('peça coberta continua bloqueada e não entra na bandeja', () => {
  const covered = makeTile('covered', 'plastico', 0, 0);
  const covering = makeTile('covering', 'papel', 0, 1);
  const board = [covered, covering];
  const tray = [];

  const result = playTile(board, tray, covered.id, 7);

  assert.equal(result.board, board);
  assert.equal(result.tray, tray);
  assert.equal(countRemainingTiles(result.board), 2);
});

test('primeiro toque é aceito sem movimento ativo e terminais são bloqueados', () => {
  const baseGate = {
    blockedByUi: false,
    duplicate: false,
    status: 'playing',
    tutorialMoveLocked: false,
  };

  assert.equal(canQueueTilePress(baseGate), true);
  assert.equal(canQueueTilePress({ ...baseGate, activeMoveStatus: 'playing' }), true);
  assert.equal(canQueueTilePress({ ...baseGate, activeMoveStatus: 'lost' }), false);
  assert.equal(canQueueTilePress({ ...baseGate, blockedByUi: true }), false);
  assert.equal(canQueueTilePress({ ...baseGate, duplicate: true }), false);
});

test('fila mantém três toques rápidos distintos em FIFO e deduplica o mesmo id', () => {
  const queue = createTileMoveQueue();
  const first = enqueueTileMove(queue, 'apple-1');
  const second = enqueueTileMove(queue, 'apple-2');

  assert.ok(first);
  assert.ok(second);
  assert.equal(enqueueTileMove(queue, 'apple-1'), undefined);
  assert.ok(enqueueTileMove(queue, 'apple-3'));
  assert.equal(activateNextTileMove(queue)?.tileId, 'apple-1');
  assert.ok(settleActiveTileMove(queue, first.token, 'cancelled'));
  assert.equal(activateNextTileMove(queue)?.tileId, 'apple-2');
});

test('bandeja cheia perde, mas uma capacidade já expandida preserva a jogada', () => {
  const incoming = makeTile('incoming', 'metal', 0);
  const remaining = makeTile('remaining', 'papel', 420);
  const tray = [
    makeTile('apple-1', 'plastico', 60),
    makeTile('banana-1', 'papel', 120),
    makeTile('melon-1', 'organico', 180),
    makeTile('star-1', 'metal', 240),
  ];

  assert.equal(playTile([incoming, remaining], tray, incoming.id, 5).status, 'lost');
  assert.equal(playTile([incoming, remaining], tray, incoming.id, 6).status, 'playing');
});

test('última peça vence mesmo quando sua chegada preenche a bandeja', () => {
  const incoming = makeTile('last-tile', 'metal', 0);
  const tray = [
    makeTile('apple-1', 'plastico', 60),
    makeTile('banana-1', 'papel', 120),
    makeTile('melon-1', 'organico', 180),
    makeTile('star-1', 'metal', 240),
  ];

  const result = playTile([incoming], tray, incoming.id, 5);

  assert.equal(result.status, 'won');
  assert.equal(result.tray.length, 5);
});

test('Undo nunca oferece um movimento que formou trinca', () => {
  const normalMove = { board: [], formedTriple: false, tray: [] };
  const tripleMove = { board: [], formedTriple: true, removedKind: 'plastico', tray: [] };

  assert.equal(getUndoableMove([normalMove]), normalMove);
  assert.equal(getUndoableMove([normalMove, tripleMove]), undefined);
});

test('boost retido e boost novo mantêm flags e capacidade da rodada sincronizados', () => {
  const retainedCoin = { bonusSlotActive: false, coinSlotActive: true };
  const incomingBonus = { bonusSlotActive: true, coinSlotActive: false };
  const merged = mergeRoundTraySlotSnapshots(retainedCoin, incomingBonus);

  assert.deepEqual(merged, { bonusSlotActive: true, coinSlotActive: true });
  assert.equal(getRoundTrayCapacity(merged, 5, 7), 7);

  const inverse = mergeRoundTraySlotSnapshots(incomingBonus, retainedCoin);
  assert.deepEqual(inverse, merged);
  assert.equal(getRoundTrayCapacity(inverse, 5, 7), 7);
});

test('regressao: papel na bandeja mais o ciclo do vidro concluem uma unica trinca', () => {
  const papel = makeTile('papel-tray', 'papel', -60);
  const board = [
    ...makeCycle('vidro', 'vidro', 0),
    makeTile('next-tile', 'metal', 180),
    ...Array.from({ length: 28 }, (_, index) =>
      makeTile(`remaining-${index + 1}`, 'organico', 240 + index * 60),
    ),
  ];
  const harness = createMoveQueueHarness(board, [papel]);

  assert.equal(countRemainingTiles(harness.board), 32);
  assert.ok(harness.enqueue('vidro-residuo'));
  assert.ok(harness.enqueue('vidro-lixeira'));
  assert.ok(harness.enqueue('vidro-simbolo'));

  const first = harness.startNext();
  assert.ok(first);
  harness.settleFlightAndConsume(first);
  const second = harness.startNext();
  assert.ok(second);
  harness.settleFlightAndConsume(second);
  const third = harness.startNext();
  assert.ok(third);

  assert.equal(countRemainingTiles(harness.board), 29);
  assert.deepEqual(
    harness.tray.map((tile) => tile.id),
    ['papel-tray', 'vidro-residuo', 'vidro-lixeira'],
  );

  // Reproduz a interrupcao observada no APK: o voo visual encerra com false.
  assert.equal(harness.settleFlight(third.entry.token, false), 'consuming');
  assert.deepEqual(harness.arrivals, [
    'vidro-residuo',
    'vidro-lixeira',
    'vidro-simbolo',
  ]);
  assert.equal(harness.finishConsume(third.entry.token), true);
  assert.equal(harness.finishConsume(third.entry.token), false);
  assert.equal(harness.tripleCount, 1);
  assert.deepEqual(harness.tray.map((tile) => tile.id), ['papel-tray']);
  assert.equal(harness.tray.length, 1);
  assert.equal(`${harness.tray.length}/7`, '1/7');
  assertEveryAcceptedMoveSettled(harness);

  assert.ok(harness.enqueue('next-tile'));
  const next = harness.startNext();
  assert.equal(next?.entry.tileId, 'next-tile');
  assert.equal(harness.settleFlight(next.entry.token), 'completed');
  assertEveryAcceptedMoveSettled(harness);
});

test('quatro IDs em FIFO continuam depois que o terceiro completa a trinca', () => {
  const harness = createMoveQueueHarness(
    [
      ...makeCycle('vidro', 'vidro', 0),
      makeTile('fourth', 'metal', 180),
      makeTile('remaining', 'organico', 240),
    ],
    [makeTile('unmatched-papel', 'papel', -60)],
  );

  ['vidro-residuo', 'vidro-lixeira', 'vidro-simbolo', 'fourth'].forEach((tileId) => {
    assert.ok(harness.enqueue(tileId));
  });

  harness.settleFlightAndConsume(harness.startNext());
  harness.settleFlightAndConsume(harness.startNext());
  const third = harness.startNext();
  assert.equal(harness.settleFlight(third.entry.token), 'consuming');
  assert.equal(harness.startNext(), undefined);
  assert.equal(harness.finishConsume(third.entry.token), true);

  const fourth = harness.startNext();
  assert.equal(fourth?.entry.tileId, 'fourth');
  assert.equal(harness.settleFlight(fourth.entry.token), 'completed');
  assert.equal(harness.tripleCount, 1);
  assert.deepEqual(harness.arrivals, [
    'vidro-residuo',
    'vidro-lixeira',
    'vidro-simbolo',
    'fourth',
  ]);
  assertEveryAcceptedMoveSettled(harness);
});

test('toque duplicado no mesmo ID cria somente uma entrada pendente', () => {
  const board = [makeTile('same-id', 'vidro', 0), makeTile('still-on-board', 'metal', 60)];
  const queue = createTileMoveQueue();
  const accepted = enqueueTileMove(queue, 'same-id');

  assert.ok(accepted);
  assert.equal(enqueueTileMove(queue, 'same-id'), undefined);
  assert.equal(countRemainingTiles(board), 2);
  assert.deepEqual(queue.queuedTokens, [accepted.token]);
  assert.equal(beginNextTileMoveGeneration(queue).length, 1);
  assert.equal(accepted.stage, 'cancelled');
});

test('callbacks muito proximos sao idempotentes e nao sobrescrevem o voo seguinte', () => {
  const harness = createMoveQueueHarness([
    makeTile('first-callback', 'plastico', 0),
    makeTile('second-callback', 'papel', 60),
    makeTile('remaining-callback', 'metal', 120),
  ]);
  harness.enqueue('first-callback');
  harness.enqueue('second-callback');

  const first = harness.startNext();
  assert.equal(harness.settleFlight(first.entry.token, true), 'completed');
  const second = harness.startNext();

  assert.equal(settleActiveTileFlight(harness.queue, first.entry.token, false), undefined);
  assert.equal(harness.settleFlight(second.entry.token, false), 'completed');
  assert.equal(harness.settleFlight(second.entry.token, true), false);
  assert.deepEqual(harness.arrivals, ['first-callback', 'second-callback']);
  assertEveryAcceptedMoveSettled(harness);
});

test('peca nao correspondente na bandeja permanece durante a fila', () => {
  const banana = makeTile('banana-existing', 'papel', -60);
  const harness = createMoveQueueHarness(
    [makeTile('gem-single', 'vidro', 0), makeTile('remaining-single', 'metal', 60)],
    [banana],
  );

  harness.enqueue('gem-single');
  const move = harness.startNext();
  assert.equal(harness.settleFlight(move.entry.token), 'completed');
  assert.deepEqual(harness.tray.map((tile) => tile.id), ['banana-existing', 'gem-single']);
  assertEveryAcceptedMoveSettled(harness);
});

test('reinicio durante a fila cancela ativo e enfileirados e invalida callback antigo', () => {
  const harness = createMoveQueueHarness([
    makeTile('restart-1', 'vidro', 0),
    makeTile('restart-2', 'vidro', 60),
    makeTile('restart-3', 'vidro', 120),
    makeTile('restart-4', 'metal', 180),
  ]);
  ['restart-1', 'restart-2', 'restart-3', 'restart-4'].forEach((tileId) => {
    harness.enqueue(tileId);
  });
  const active = harness.startNext();
  const previousGeneration = harness.queue.generation;

  const cancelled = beginNextTileMoveGeneration(harness.queue);

  assert.equal(harness.queue.generation, previousGeneration + 1);
  assert.equal(cancelled.length, 4);
  assert.equal(settleActiveTileFlight(harness.queue, active.entry.token, true), undefined);
  assert.equal(settleActiveTileMove(harness.queue, active.entry.token, 'cancelled'), undefined);
  assertEveryAcceptedMoveSettled(harness);
});

test('toda selecao aceita termina exatamente uma vez como concluida ou cancelada', () => {
  const queue = createTileMoveQueue();
  const completed = enqueueTileMove(queue, 'completed-id');
  const cancelled = enqueueTileMove(queue, 'cancelled-id');

  assert.equal(activateNextTileMove(queue), completed);
  assert.ok(settleActiveTileFlight(queue, completed.token, true));
  assert.ok(settleActiveTileMove(queue, completed.token, 'completed'));
  assert.equal(settleActiveTileMove(queue, completed.token, 'completed'), undefined);
  assert.deepEqual(beginNextTileMoveGeneration(queue), [cancelled]);
  assert.equal(completed.stage, 'completed');
  assert.equal(cancelled.stage, 'cancelled');
  assert.notEqual(completed.stage, cancelled.stage);
  assert.equal(getOutstandingTileMoves(queue).length, 0);
});
