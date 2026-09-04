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

const { LEVELS } = require('../src/data/levels.ts');
const { CHAPTER_LEVELS, buildChapterLevel } = require('../src/data/chapters.ts');
const { generatePlayableLevel } = require('../src/utils/levelGenerator.ts');
const {
  countRemainingTiles,
  getPlayableTiles,
  revealAvailableMysteryTiles,
} = require('../src/domain/recycling/services/BoardService.ts');
const { playTile } = require('../src/domain/recycling/services/PlayService.ts');
const { activeMatchRule } = require('../src/domain/recycling/policies/MatchRuleRegistry.ts');
const { BASE_TRAY_CAPACITY } = require('../src/storage/trayBoostStorage.ts');
const { createSeededRandom, stableHash } = require('../src/utils/deterministicRandom.ts');

/**
 * "Jogador simulado": não é um teste unitário, é uma automação que joga o
 * jogo de verdade — mesmas funções de domínio que a tela de jogo usa
 * (`playTile`, `getPlayableTiles`) — através de todas as fases da campanha e
 * de todos os 1000 mapas de capítulo, para pegar fase quebrada (travada,
 * impossível de fechar, ou que derruba uma exceção) antes que um jogador
 * chegue nela.
 *
 * ## Por que não é `npm test`
 *
 * `npm test` roda em poucos segundos e trava o build no CI. Esta simulação
 * joga milhares de partidas completas (103 fases x 3 sementes + 1000 mapas x
 * 3 sessões) e leva dezenas de segundos — é ferramenta de auditoria sob
 * demanda (`npm run test:playthrough`), não gate de commit. Por isso o nome
 * do arquivo não termina em `.test.cjs`: `node --test tests` (o `npm test`)
 * não pega arquivo fora desse padrão.
 *
 * ## Por que gerar o tabuleiro em vez de ler `LEVELS`/`CHAPTER_LEVELS` direto
 *
 * O jogador nunca joga o array cru de `levels.ts`. `GameScreen` monta o
 * tabuleiro de verdade chamando `generatePlayableLevel`/`buildChapterLevel` a
 * cada vez que abre ou tenta de novo uma fase — e é só esse caminho que
 * garante a trinca de um material em três posições consecutivas da ordem de
 * remoção (`assignCardsToRemovalOrder`, em `LevelCompositionService.ts`).
 * Simular o array cru testaria dado que nenhum jogador vê.
 *
 * ## Como o "jogador" escolhe a jogada
 *
 * Busca com retrocesso (DFS) orçada em nós e memoizada por estado
 * (peças removidas + peças na bandeja, como bitmask): tenta fechar trinca na
 * hora; senão prioriza continuar um material já na bandeja; senão prefere
 * abrir um material novo só se as outras duas peças dele já estão jogáveis
 * agora (abertura segura); e evita abrir material novo com a bandeja
 * apertada. É retrocesso, não só um palpite guloso — sem ele, fases
 * legítimas apareceriam como "impossíveis" só porque a primeira escolha
 * gulosa não era a certa, o que seria falso positivo.
 */

const NODE_BUDGET = 50000;
const CAMPAIGN_SEEDS_PER_LEVEL = 3;
const CHAPTER_RETRY_SEEDS_PER_MAP = 2;

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
      const sameMaterialPlayable = playable.filter((candidate) => candidate.kind === tile.kind);
      const rolesPresent = new Set(sameMaterialPlayable.map((candidate) => candidate.role));
      const isSafeToOpen = tripleRoles.every((role) => rolesPresent.has(role));
      // "Abertura segura": as outras duas peças do material já estão
      // jogáveis agora, então dá para fechar em até dois lances sem
      // depender de mais nada ficar disponível.
      score = isSafeToOpen ? 300 : 100;
    }

    if (preview.status !== 'lost') {
      // Entre jogadas de mesma prioridade, prefere a que deixa a bandeja
      // mais vazia.
      score -= preview.tray.length;
    }

    return { preview, score, tile };
  });

  scored.sort((first, second) => second.score - first.score);
  return scored;
};

const solve = (board, tray, removedMask, trayMask, capacity, rule, budget, idToBit, deadStates) => {
  if (countRemainingTiles(board) === 0) {
    return { path: [], solved: true };
  }

  // Chaves de até CHAPTER_MAX_SUPPORTED_TILE_COUNT (102) bits cada; deslocar
  // por 128 em vez de multiplicar por 1e9 (~30 bits) evita colisão entre
  // estados diferentes assim que algum tabuleiro passa de ~30 peças, o que
  // é o caso comum (capítulos chegam a 102).
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

const simulateLevel = (level, trayCapacity, rule) => {
  const board = revealAvailableMysteryTiles(
    level.tiles.map((tile) => ({ ...tile, removed: false })),
  );
  const idToBit = new Map(level.tiles.map((tile, index) => [tile.id, 1n << BigInt(index)]));
  const budget = { count: NODE_BUDGET };
  const deadStates = new Set();
  const result = solve(board, [], 0n, 0n, trayCapacity, rule, budget, idToBit, deadStates);

  return { ...result, nodesUsed: NODE_BUDGET - budget.count };
};

/**
 * Roda uma sessão simulada (uma fase, um tabuleiro concreto) e nunca deixa
 * uma exceção do domínio derrubar a auditoria inteira — vira uma anomalia
 * relatada, com o mesmo tratamento de "não venceu".
 */
const playSession = (label, level, trayCapacity, rule) => {
  try {
    const outcome = simulateLevel(level, trayCapacity, rule);

    if (!outcome.solved) {
      return `${label}: não venceu (${outcome.reason}, nós=${outcome.nodesUsed})`;
    }

    return undefined;
  } catch (error) {
    return `${label}: exceção durante a simulação — ${error.message}`;
  }
};

test('todas as 103 fases da campanha são vencíveis por um jogador simulado, bandeja base (sem boost pago)', () => {
  const failures = [];

  LEVELS.forEach((baseLevel, index) => {
    for (let seedIndex = 0; seedIndex < CAMPAIGN_SEEDS_PER_LEVEL; seedIndex += 1) {
      const random = createSeededRandom(stableHash(`${baseLevel.id}:playthrough:${seedIndex}`));
      const level = generatePlayableLevel(baseLevel.id, { random });
      const failure = playSession(`${baseLevel.id} (sessão ${seedIndex + 1})`, level, BASE_TRAY_CAPACITY, activeMatchRule);
      if (failure) {
        failures.push(failure);
      }
    }

    if ((index + 1) % 50 === 0) {
      console.log(`  ...campanha: ${index + 1}/${LEVELS.length} fases jogadas`);
    }
  });

  assert.deepEqual(failures, []);
});

test('todos os 1000 mapas de capítulo são vencíveis por um jogador simulado, bandeja base (aberto + retry)', () => {
  const failures = [];

  CHAPTER_LEVELS.forEach(({ id }, index) => {
    const defaultLevel = buildChapterLevel(id);
    const defaultFailure = playSession(`${id} (abrir)`, defaultLevel, BASE_TRAY_CAPACITY, activeMatchRule);
    if (defaultFailure) {
      failures.push(defaultFailure);
    }

    for (let seedIndex = 0; seedIndex < CHAPTER_RETRY_SEEDS_PER_MAP; seedIndex += 1) {
      const random = createSeededRandom(stableHash(`${id}:retry:${seedIndex}`));
      const level = buildChapterLevel(id, { random });
      const failure = playSession(`${id} (retry ${seedIndex + 1})`, level, BASE_TRAY_CAPACITY, activeMatchRule);
      if (failure) {
        failures.push(failure);
      }
    }

    if ((index + 1) % 200 === 0) {
      console.log(`  ...capítulos: ${index + 1}/${CHAPTER_LEVELS.length} mapas jogados`);
    }
  });

  assert.deepEqual(failures, []);
});
