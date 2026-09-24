/**
 * O solucionador do jogador simulado, sem saber de onde vem o domínio.
 *
 * ## Por que recebe as funções em vez de importá-las
 *
 * Dois mundos precisam do mesmo jogador e carregam TypeScript de formas
 * incompatíveis:
 *
 * - As auditorias em `node:test` (`simulateFullPlaythrough.cjs`) resolvem `.ts`
 *   por um hook de `require.extensions` montado à mão.
 * - Os testes de componente rodam no Jest, que tem o transform dele e quebra se
 *   um hook de `require.extensions` for instalado por baixo.
 *
 * Importar `BoardService.ts` daqui obrigaria a escolher um dos dois. Recebendo
 * `countRemainingTiles`, `getPlayableTiles` e `playTile` como parâmetro, este
 * arquivo é JavaScript puro que funciona nos dois — e o jogador que audita
 * tabuleiro é literalmente o mesmo que joga pela interface, em vez de duas
 * cópias que divergem na primeira vez que a heurística mudar.
 */

/**
 * Teto de nós da busca. Fase que não fecha dentro disso é relatada como
 * `budget-exceeded`, não como impossível — a diferença importa, porque as duas
 * pedem investigação diferente.
 */
const NODE_BUDGET = 50000;

const criarJogador = ({ countRemainingTiles, getPlayableTiles, playTile }) => {
  const scoreCandidates = (board, tray, capacity, rule) => {
    const playable = getPlayableTiles(board);
    const trayKinds = new Set(tray.map((tile) => tile.kind));
    const tripleRoles = rule.buildTripleRoles();

    const scored = playable.map((tile) => {
      const preview = playTile(board, tray, tile.id, capacity, rule);
      let score;

      if (preview.removedKind) {
        // Fecha trinca agora: sempre a melhor jogada, esvazia a bandeja.
        score = 1000;
      } else if (trayKinds.has(tile.kind)) {
        // Avança um material que já está na bandeja em vez de abrir outro.
        score = 500;
      } else {
        const sameMaterialPlayable = playable.filter(
          (candidate) => candidate.kind === tile.kind,
        );
        const rolesPresent = new Set(
          sameMaterialPlayable.map((candidate) => candidate.role),
        );
        const isSafeToOpen = tripleRoles.every((role) =>
          rolesPresent.has(role),
        );
        // "Abertura segura": as outras duas peças do material já estão jogáveis
        // agora, então dá para fechar em até dois lances sem depender de mais
        // nada ficar disponível.
        score = isSafeToOpen ? 300 : 100;
      }

      if (preview.status !== 'lost') {
        // Entre jogadas de mesma prioridade, prefere a que deixa a bandeja mais
        // vazia.
        score -= preview.tray.length;
      }

      return { preview, score, tile };
    });

    scored.sort((first, second) => second.score - first.score);
    return scored;
  };

  const solve = (
    board,
    tray,
    removedMask,
    trayMask,
    capacity,
    rule,
    budget,
    idToBit,
    deadStates,
  ) => {
    if (countRemainingTiles(board) === 0) {
      return { path: [], solved: true };
    }

    // Chaves de até CHAPTER_MAX_SUPPORTED_TILE_COUNT (102) bits cada; deslocar
    // por 128 em vez de multiplicar por 1e9 (~30 bits) evita colisão entre
    // estados diferentes assim que algum tabuleiro passa de ~30 peças, o que é
    // o caso comum (capítulos chegam a 102).
    const stateKey = (removedMask << 128n) | trayMask;
    if (deadStates.has(stateKey)) {
      return { reason: 'memo', solved: false };
    }

    if (budget.count <= 0) {
      return { reason: 'budget-exceeded', solved: false };
    }

    budget.count -= 1;

    const scored = scoreCandidates(board, tray, capacity, rule);
    if (scored.length === 0) {
      deadStates.add(stateKey);
      return { reason: 'stuck', solved: false };
    }

    for (const candidate of scored) {
      if (candidate.preview.status === 'lost') {
        // A bandeja transbordou: fim de jogo, ramo sem saída por definição.
        continue;
      }

      const nextRemovedMask = removedMask | idToBit.get(candidate.tile.id);
      let nextTrayMask = 0n;
      candidate.preview.tray.forEach((tile) => {
        nextTrayMask |= idToBit.get(tile.id);
      });

      const result = solve(
        candidate.preview.board,
        candidate.preview.tray,
        nextRemovedMask,
        nextTrayMask,
        capacity,
        rule,
        budget,
        idToBit,
        deadStates,
      );

      if (result.solved) {
        return { path: [candidate.tile.id, ...result.path], solved: true };
      }
      if (budget.count <= 0) {
        return { reason: 'budget-exceeded', solved: false };
      }
    }

    // Só marca "sem saída" depois de esgotar toda alternativa — nunca num
    // retorno por orçamento, senão um estado só ainda-não-explorado ficaria
    // memoizado como definitivamente morto.
    deadStates.add(stateKey);
    return { reason: 'exhausted', solved: false };
  };

  /**
   * Joga um tabuleiro concreto do início ao fim.
   *
   * Devolve `{ solved, path, reason, nodesUsed }`. `path` é a sequência de
   * peças que venceu, na ordem — é o que um teste de interface usa para tocar
   * nas peças certas.
   *
   * Recebe o tabuleiro já revelado; quem revela é o chamador, porque
   * `revealAvailableMysteryTiles` mora no mesmo módulo de domínio que este
   * arquivo de propósito não importa.
   */
  const simulateLevel = (
    level,
    board,
    trayCapacity,
    rule,
    teto = NODE_BUDGET,
  ) => {
    const idToBit = new Map(
      level.tiles.map((tile, index) => [tile.id, 1n << BigInt(index)]),
    );
    const budget = { count: teto };
    const deadStates = new Set();
    const result = solve(
      board,
      [],
      0n,
      0n,
      trayCapacity,
      rule,
      budget,
      idToBit,
      deadStates,
    );

    return { ...result, nodesUsed: teto - budget.count };
  };

  return { scoreCandidates, simulateLevel };
};

module.exports = { NODE_BUDGET, criarJogador };
