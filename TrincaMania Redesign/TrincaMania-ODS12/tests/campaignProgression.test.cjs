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
const { getWorldById } = require('../src/data/worlds.ts');
const {
  applyLevelCompletion,
  createInitialProgress,
} = require('../src/storage/progressStorage.ts');

/**
 * A campanha é atravessável de ponta a ponta?
 *
 * `simulateFullPlaythrough.cjs` prova que todo **tabuleiro** fecha, mas joga as
 * fases direto, pela lista. Ninguém verificava a pergunta anterior a essa: se o
 * jogador, partindo de um save em branco e só podendo jogar o que está
 * desbloqueado, **chega** em todas elas. São defeitos de natureza diferente —
 * uma regra de desbloqueio errada não quebra nenhum tabuleiro, ela deixa o
 * jogador parado numa tela onde não há mais nada clicável, com o jogo
 * inteiramente funcional atrás do bloqueio.
 *
 * Este arquivo simula a carreira pela mesma função que a tela de vitória chama
 * (`applyLevelCompletion`), sem montar tabuleiro nenhum — é o que o torna
 * rápido o bastante (~1s) para caber no gate de commit, ao contrário da
 * auditoria de tabuleiros, que leva quase um minuto e por isso roda sob demanda
 * (`npm run test:playthrough`). As duas juntas cobrem a pergunta inteira: uma
 * diz que dá para chegar em toda fase, a outra que toda fase fecha.
 *
 * O limite de segurança do laço é o que transforma "trava" em falha de teste em
 * vez de suíte pendurada: sem ele, uma regressão que fizesse a fronteira parar
 * de avançar rodaria para sempre.
 */

const BONUS_LEVEL_IDS = LEVELS.filter(
  (level) => getWorldById(level.worldId).isBonus,
).map((level) => level.id);

const NORMAL_LEVEL_IDS = LEVELS.filter(
  (level) => !getWorldById(level.worldId).isBonus,
).map((level) => level.id);

const WORLD_1_LEVEL_IDS = LEVELS.filter((level) => level.worldId === 1).map(
  (level) => level.id,
);

const TETO_DE_JOGADAS = LEVELS.length * 2;

/**
 * Joga a carreira do começo, sempre escolhendo a primeira fase desbloqueada e
 * ainda não concluída, com um número fixo de estrelas.
 *
 * Devolve o progresso final mais o diário do percurso: quantas jogadas, se a
 * fronteira ficou vazia antes da hora e como as moedas evoluíram.
 */
const jogarCarreira = ({ estrelas, incluirBonus = true }) => {
  let progress = createInitialProgress();
  const ordemJogada = [];
  const moedasPorJogada = [];

  for (let jogada = 0; jogada < TETO_DE_JOGADAS; jogada += 1) {
    const concluidas = new Set(progress.completedLevelIds);
    const proxima = progress.unlockedLevelIds.find(
      (levelId) =>
        !concluidas.has(levelId) &&
        (incluirBonus || !BONUS_LEVEL_IDS.includes(levelId)),
    );

    if (!proxima) {
      return { moedasPorJogada, ordemJogada, progress, travou: false };
    }

    const resultado = applyLevelCompletion(progress, proxima, estrelas);
    progress = resultado.progress;
    ordemJogada.push(proxima);
    moedasPorJogada.push(progress.coins);
  }

  return { moedasPorJogada, ordemJogada, progress, travou: true };
};

test('carreira de 3 estrelas conclui as 103 fases sem a fronteira nunca esvaziar', () => {
  const { ordemJogada, progress, travou } = jogarCarreira({ estrelas: 3 });

  assert.equal(travou, false, 'a carreira estourou o teto de jogadas');
  assert.equal(
    progress.completedLevelIds.length,
    LEVELS.length,
    `concluiu ${progress.completedLevelIds.length} de ${LEVELS.length} fases`,
  );
  // Nenhuma fase foi jogada duas vezes: cada conclusão avançou a fronteira.
  assert.equal(new Set(ordemJogada).size, ordemJogada.length);
});

test('carreira de 1 estrela conclui as 100 fases normais, mas o mundo bônus continua trancado', () => {
  const { progress, travou } = jogarCarreira({ estrelas: 1 });

  assert.equal(travou, false);

  const concluidas = new Set(progress.completedLevelIds);
  const normaisPendentes = NORMAL_LEVEL_IDS.filter((id) => !concluidas.has(id));
  assert.deepEqual(
    normaisPendentes,
    [],
    'fase normal ficou inalcançável para quem tira 1 estrela',
  );

  // O portão do bônus é `hasThreeStarsInWorldByStars(1, ...)`. Com 1 estrela em
  // tudo ele tem que continuar fechado — e nenhuma fase bônus pode ter sido
  // jogada por acidente.
  const bonusDesbloqueadas = BONUS_LEVEL_IDS.filter((id) =>
    progress.unlockedLevelIds.includes(id),
  );
  assert.deepEqual(bonusDesbloqueadas, []);
  assert.deepEqual(
    BONUS_LEVEL_IDS.filter((id) => concluidas.has(id)),
    [],
  );
});

test('o mundo bônus abre com 3 estrelas no mundo 1, sem depender do resto da campanha', () => {
  let progress = createInitialProgress();

  // Só o mundo 1, tudo com 3 estrelas. `applyLevelCompletion` exige que a fase
  // esteja desbloqueada na prática, e o mundo 1 é linear a partir da primeira.
  WORLD_1_LEVEL_IDS.forEach((levelId) => {
    progress = applyLevelCompletion(progress, levelId, 3).progress;
  });

  const bonusDesbloqueadas = BONUS_LEVEL_IDS.filter((id) =>
    progress.unlockedLevelIds.includes(id),
  );

  assert.ok(
    bonusDesbloqueadas.length > 0,
    'três estrelas no mundo 1 não abriram nenhuma fase bônus',
  );
  assert.equal(
    progress.completedLevelIds.length,
    WORLD_1_LEVEL_IDS.length,
    'abrir o bônus não pode marcar fase nenhuma como concluída',
  );
});

test('perder uma estrela numa refeita não tranca de volta o que já estava aberto', () => {
  let progress = createInitialProgress();

  WORLD_1_LEVEL_IDS.forEach((levelId) => {
    progress = applyLevelCompletion(progress, levelId, 3).progress;
  });

  const antes = progress.unlockedLevelIds.slice();

  // Refaz a primeira fase mal. `savedStars` é o máximo histórico, então o
  // portão do bônus não pode reagir a isso — se reagisse, o jogador perderia
  // acesso a um mundo por ter jogado de novo, que é a pior forma de regressão
  // de progresso: silenciosa e provocada pelo próprio jogador.
  const refeita = applyLevelCompletion(progress, WORLD_1_LEVEL_IDS[0], 1);

  assert.equal(refeita.savedStars, 3);
  assert.deepEqual(refeita.progress.unlockedLevelIds, antes);
});

test('a economia nunca regride: refazer fase não paga de novo e moeda não fica negativa', () => {
  const { moedasPorJogada, progress } = jogarCarreira({ estrelas: 3 });

  assert.ok(moedasPorJogada.length > 0);

  moedasPorJogada.forEach((moedas, indice) => {
    assert.ok(moedas >= 0, `moedas negativas na jogada ${indice + 1}`);
    if (indice > 0) {
      assert.ok(
        moedas >= moedasPorJogada[indice - 1],
        `moedas caíram na jogada ${indice + 1} sem nenhuma compra`,
      );
    }
  });

  // Refazer com o mesmo desempenho não pode pagar de novo: a recompensa é
  // incremental sobre o melhor resultado anterior, senão a fase 1 vira uma
  // torneira infinita de moeda.
  const refeita = applyLevelCompletion(progress, LEVELS[0].id, 3);
  assert.equal(refeita.coinsEarned, 0);
  assert.equal(refeita.progress.coins, progress.coins);
});

test('nenhuma fase da campanha exige moeda ou chave para ser alcançada', () => {
  const { progress } = jogarCarreira({ estrelas: 3 });

  // A carreira acima nunca gastou nada — nem comprou chave, nem abriu baú. Se
  // ela mesmo assim chegou ao fim, nenhum passo do caminho principal está
  // atrás de uma parede de moeda, que é a forma clássica de trava dura num
  // jogo com economia.
  assert.equal(progress.completedLevelIds.length, LEVELS.length);
  assert.equal(progress.keys, 0);
});
