const assert = require('node:assert/strict');
const test = require('node:test');

const { criarJogador } = require('./lib/solver.cjs');
const { registrarTypeScript } = require('./lib/typescript.cjs');

registrarTypeScript();

const {
  countRemainingTiles,
  getPlayableTiles,
  isMysteryTileHidden,
  revealAvailableMysteryTiles,
} = require('../src/domain/recycling/services/BoardService.ts');
const { playTile } = require('../src/domain/recycling/services/PlayService.ts');
const {
  shuffleRemainingTiles,
} = require('../src/domain/recycling/services/ShuffleService.ts');
const {
  activeMatchRule,
} = require('../src/domain/recycling/policies/MatchRuleRegistry.ts');
const { generatePlayableLevel } = require('../src/utils/levelGenerator.ts');
const {
  createSeededRandom,
  stableHash,
} = require('../src/utils/deterministicRandom.ts');
const { BASE_TRAY_CAPACITY } = require('../src/storage/trayBoostStorage.ts');

/**
 * O embaralhar, que é um poder que o jogador **compra**.
 *
 * O arquivo estava com 0% de cobertura, e é o pior lugar para isso: ele
 * redistribui cartas entre peças que continuam no tabuleiro, e um erro aqui não
 * aparece como tela quebrada — aparece como fase que ficou impossível depois de
 * o jogador gastar moeda para melhorar a situação. O prejuízo é duplo, e o
 * jogador não tem como saber que o culpado foi o poder.
 *
 * Por isso a asserção central não é "as cartas mudaram de lugar", e sim que o
 * **conjunto** de cartas é idêntico ao de antes e que o tabuleiro resultante
 * continua vencível — esta última medida pelo mesmo solucionador que audita as
 * 103 fases.
 */

const jogador = criarJogador({
  countRemainingTiles,
  getPlayableTiles,
  playTile,
});

const montarTabuleiro = (levelId, semente) => {
  const level = generatePlayableLevel(levelId, {
    random: createSeededRandom(stableHash(semente)),
  });
  const board = revealAvailableMysteryTiles(
    level.tiles.map((tile) => ({ ...tile, removed: false })),
  );

  return { board, level };
};

/** Contagem por carta: é o que precisa sobreviver ao embaralhar. */
const contarCartas = (tiles) =>
  tiles.reduce((contagem, tile) => {
    const chave = `${tile.cardId}|${tile.kind}|${tile.role}`;

    return contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }, new Map());

const FASES_DE_AMOSTRA = ['w1-001', 'w2-005', 'w4-003', 'w6-008', 'w9-010'];

test('embaralhar preserva o conjunto exato de cartas em jogo', () => {
  FASES_DE_AMOSTRA.forEach((levelId) => {
    const { board } = montarTabuleiro(levelId, `shuffle:${levelId}`);
    const embaralhado = shuffleRemainingTiles(
      board,
      createSeededRandom(stableHash(`random:${levelId}`)),
    );

    const antes = contarCartas(board);
    const depois = contarCartas(embaralhado);

    assert.deepEqual(
      [...depois.entries()].sort(),
      [...antes.entries()].sort(),
      `${levelId}: o embaralhar criou ou destruiu carta`,
    );
    assert.equal(embaralhado.length, board.length);
  });
});

test('embaralhar move carta, nunca peça: id, posição e camada continuam onde estavam', () => {
  const { board } = montarTabuleiro('w6-008', 'shuffle:posicoes');
  const embaralhado = shuffleRemainingTiles(
    board,
    createSeededRandom(stableHash('random:posicoes')),
  );

  embaralhado.forEach((tile, indice) => {
    const original = board[indice];

    // A posição é o tabuleiro; a carta é o conteúdo. Trocar a posição junto
    // faria as peças saltarem na tela e desmontaria as camadas de bloqueio.
    assert.equal(tile.id, original.id);
    assert.equal(tile.x, original.x);
    assert.equal(tile.y, original.y);
    assert.equal(tile.layer, original.layer);
    assert.equal(tile.removed, original.removed);
  });

  const mudou = embaralhado.some(
    (tile, indice) => tile.cardId !== board[indice].cardId,
  );
  assert.ok(mudou, 'nenhuma carta mudou de peça: o poder não fez nada');
});

test('peça já removida não volta ao jogo pelo embaralhar', () => {
  const { board } = montarTabuleiro('w4-003', 'shuffle:removidas');

  // Joga algumas peças de verdade para haver removidas no tabuleiro.
  let atual = board;
  let bandeja = [];

  for (let jogada = 0; jogada < 6; jogada += 1) {
    const jogavel = getPlayableTiles(atual)[0];
    const resultado = playTile(
      atual,
      bandeja,
      jogavel.id,
      BASE_TRAY_CAPACITY,
      activeMatchRule,
    );
    atual = resultado.board;
    bandeja = resultado.tray;
  }

  const removidasAntes = atual.filter((tile) => tile.removed === true);
  assert.ok(removidasAntes.length > 0, 'nenhuma peça saiu do tabuleiro');

  const embaralhado = shuffleRemainingTiles(
    atual,
    createSeededRandom(stableHash('random:removidas')),
  );

  removidasAntes.forEach((removida) => {
    const depois = embaralhado.find((tile) => tile.id === removida.id);
    assert.deepEqual(
      depois,
      removida,
      'peça removida foi alterada pelo embaralhar',
    );
  });

  assert.equal(
    countRemainingTiles(embaralhado),
    countRemainingTiles(atual),
    'o embaralhar mudou quantas peças ainda estão em jogo',
  );
});

test('a mesma semente embaralha do mesmo jeito, e sementes diferentes divergem', () => {
  const { board } = montarTabuleiro('w2-005', 'shuffle:determinismo');
  const cartas = (tiles) => tiles.map((tile) => tile.cardId).join(',');

  const primeira = shuffleRemainingTiles(
    board,
    createSeededRandom(stableHash('semente-a')),
  );
  const repetida = shuffleRemainingTiles(
    board,
    createSeededRandom(stableHash('semente-a')),
  );
  const outra = shuffleRemainingTiles(
    board,
    createSeededRandom(stableHash('semente-b')),
  );

  // Determinismo por semente é o que torna um bug de embaralhar reproduzível:
  // sem isso, "a fase travou depois que embaralhei" não vira teste.
  assert.equal(cartas(primeira), cartas(repetida));
  assert.notEqual(cartas(primeira), cartas(outra));
});

test('as cartas distintas vão primeiro para as peças visíveis, não para as de mistério', () => {
  const comMisterio = FASES_DE_AMOSTRA.map((levelId) =>
    montarTabuleiro(levelId, `misterio:${levelId}`),
  ).find(({ board }) => board.some((tile) => isMysteryTileHidden(tile)));

  // Sem peça oculta na amostra não há o que verificar — e falhar essa premissa
  // em silêncio esconderia o teste inteiro em vez de mostrar que ele parou de
  // exercitar alguma coisa.
  assert.ok(comMisterio, 'nenhuma fase da amostra tem peça de mistério oculta');

  const embaralhado = shuffleRemainingTiles(
    comMisterio.board,
    createSeededRandom(stableHash('random:misterio')),
  );

  const emJogo = embaralhado.filter((tile) => tile.removed !== true);
  const visiveis = emJogo.filter((tile) => !isMysteryTileHidden(tile));
  const distintasNoTabuleiro = new Set(emJogo.map((tile) => tile.cardId)).size;
  const distintasVisiveis = new Set(visiveis.map((tile) => tile.cardId)).size;

  // O jogador só decide a jogada com o que consegue ver. Empurrar as repetidas
  // para trás das peças de mistério é o que evita a "parede de iguais" — e é
  // uma promessa do código que ninguém estava cobrando.
  assert.equal(
    distintasVisiveis,
    Math.min(distintasNoTabuleiro, visiveis.length),
    'carta distinta ficou escondida atrás de peça de mistério',
  );
});

test('tabuleiro embaralhado continua vencível', () => {
  FASES_DE_AMOSTRA.forEach((levelId) => {
    const { board, level } = montarTabuleiro(levelId, `vencivel:${levelId}`);
    const embaralhado = shuffleRemainingTiles(
      board,
      createSeededRandom(stableHash(`random:vencivel:${levelId}`)),
    );

    const resultado = jogador.simulateLevel(
      level,
      embaralhado,
      BASE_TRAY_CAPACITY,
      activeMatchRule,
    );

    assert.ok(
      resultado.solved,
      `${levelId}: embaralhar deixou a fase sem solução (${resultado.reason})`,
    );
  });
});
