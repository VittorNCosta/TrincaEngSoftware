const assert = require('node:assert/strict');
const test = require('node:test');

// Registra o hook de `.ts`; precisa vir antes de qualquer require de `.ts`.
const { playSession } = require('./lib/simulatedPlayer.cjs');

const { LEVELS } = require('../src/data/levels.ts');
const {
  CHAPTER_LEVELS,
  buildChapterLevel,
} = require('../src/data/chapters.ts');
const { generatePlayableLevel } = require('../src/utils/levelGenerator.ts');
const {
  activeMatchRule,
} = require('../src/domain/recycling/policies/MatchRuleRegistry.ts');
const { BASE_TRAY_CAPACITY } = require('../src/storage/trayBoostStorage.ts');
const {
  createSeededRandom,
  stableHash,
} = require('../src/utils/deterministicRandom.ts');

/**
 * Auditoria de **cobertura de tabuleiro**: joga o jogo de verdade — mesmas
 * funções de domínio que a tela usa — em todas as fases da campanha e em todos
 * os 1000 mapas de capítulo, para pegar fase quebrada (travada, impossível de
 * fechar, ou que derruba exceção) antes que um jogador chegue nela.
 *
 * A pergunta aqui é "todo tabuleiro fecha?". A pergunta complementar — "uma
 * carreira inteira fecha, respeitando desbloqueio e vidas?" — é de
 * `tests/simulateCareer.cjs`, que usa o mesmo jogador simulado.
 *
 * ## Por que não é `npm test`
 *
 * `npm test` roda em segundos e trava o build no CI. Esta simulação joga
 * milhares de partidas completas (103 fases × 3 sementes + 1000 mapas ×
 * sessões) e leva dezenas de segundos — é ferramenta de auditoria sob demanda
 * (`npm run test:playthrough`), não gate de commit. Por isso o nome do arquivo
 * não termina em `.test.cjs`: o `npm test` não pega arquivo fora desse padrão.
 *
 * ## Por que gerar o tabuleiro em vez de ler `LEVELS`/`CHAPTER_LEVELS` direto
 *
 * O jogador nunca joga o array cru de `levels.ts`. `GameScreen` monta o
 * tabuleiro de verdade chamando `generatePlayableLevel`/`buildChapterLevel` a
 * cada vez que abre ou tenta de novo uma fase — e é só esse caminho que
 * garante a trinca de um material em três posições consecutivas da ordem de
 * remoção (`assignCardsToRemovalOrder`, em `LevelCompositionService.ts`).
 * Simular o array cru testaria dado que nenhum jogador vê.
 */

const CAMPAIGN_SEEDS_PER_LEVEL = 3;
const CHAPTER_RETRY_SEEDS_PER_MAP = 2;

test('todas as 103 fases da campanha são vencíveis por um jogador simulado, bandeja base (sem boost pago)', () => {
  const failures = [];

  LEVELS.forEach((baseLevel, index) => {
    for (
      let seedIndex = 0;
      seedIndex < CAMPAIGN_SEEDS_PER_LEVEL;
      seedIndex += 1
    ) {
      const random = createSeededRandom(
        stableHash(`${baseLevel.id}:playthrough:${seedIndex}`),
      );
      const level = generatePlayableLevel(baseLevel.id, { random });
      const failure = playSession(
        `${baseLevel.id} (sessão ${seedIndex + 1})`,
        level,
        BASE_TRAY_CAPACITY,
        activeMatchRule,
      );
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
    const defaultFailure = playSession(
      `${id} (abrir)`,
      defaultLevel,
      BASE_TRAY_CAPACITY,
      activeMatchRule,
    );
    if (defaultFailure) {
      failures.push(defaultFailure);
    }

    for (
      let seedIndex = 0;
      seedIndex < CHAPTER_RETRY_SEEDS_PER_MAP;
      seedIndex += 1
    ) {
      const random = createSeededRandom(stableHash(`${id}:retry:${seedIndex}`));
      const level = buildChapterLevel(id, { random });
      const failure = playSession(
        `${id} (retry ${seedIndex + 1})`,
        level,
        BASE_TRAY_CAPACITY,
        activeMatchRule,
      );
      if (failure) {
        failures.push(failure);
      }
    }

    if ((index + 1) % 200 === 0) {
      console.log(
        `  ...capítulos: ${index + 1}/${CHAPTER_LEVELS.length} mapas jogados`,
      );
    }
  });

  assert.deepEqual(failures, []);
});
