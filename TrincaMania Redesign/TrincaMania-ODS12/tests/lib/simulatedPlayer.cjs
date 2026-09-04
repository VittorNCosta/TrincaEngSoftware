/**
 * O jogador simulado do lado `node:test`: liga o solucionador de
 * `tests/lib/solver.cjs` ao domínio de verdade, carregado por um hook de
 * `require.extensions` para `.ts`.
 *
 * O solucionador mora noutro arquivo porque o Jest também o usa — e lá o
 * carregamento de TypeScript é do Jest, não deste hook. Ver o cabeçalho de
 * `solver.cjs` para por que ele recebe o domínio em vez de importá-lo.
 *
 * Quem usar esta lib precisa exigi-la **antes** de qualquer `require` de `.ts`:
 * o hook é instalado no carregamento deste módulo.
 */
const fs = require('node:fs');
const ts = require('typescript');

const { NODE_BUDGET, criarJogador } = require('./solver.cjs');

/** Idempotente: vários arquivos carregam a lib no mesmo processo. */
const registrarTypeScript = () => {
  if (require.extensions['.ts']) {
    return;
  }

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
};

registrarTypeScript();

const {
  countRemainingTiles,
  getPlayableTiles,
  revealAvailableMysteryTiles,
} = require('../../src/domain/recycling/services/BoardService.ts');
const {
  playTile,
} = require('../../src/domain/recycling/services/PlayService.ts');

const jogador = criarJogador({
  countRemainingTiles,
  getPlayableTiles,
  playTile,
});

/** Monta o tabuleiro inicial de uma fase e joga do início ao fim. */
const simulateLevel = (level, trayCapacity, rule, teto = NODE_BUDGET) => {
  const board = revealAvailableMysteryTiles(
    level.tiles.map((tile) => ({ ...tile, removed: false })),
  );

  return jogador.simulateLevel(level, board, trayCapacity, rule, teto);
};

/**
 * Roda uma sessão simulada e nunca deixa uma exceção do domínio derrubar a
 * auditoria inteira — vira uma anomalia relatada, com o mesmo tratamento de
 * "não venceu". Devolve `undefined` quando venceu.
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

module.exports = {
  NODE_BUDGET,
  playSession,
  registrarTypeScript,
  simulateLevel,
};
