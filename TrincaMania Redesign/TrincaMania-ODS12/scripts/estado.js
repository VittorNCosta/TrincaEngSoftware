#!/usr/bin/env node
/**
 * Escreve `.claude/estado.md`: onde o trabalho parou, para a próxima sessão
 * saber sem perguntar.
 *
 *     node scripts/estado.js                      # regenera o arquivo
 *     node scripts/estado.js --nota "texto"       # anota a tarefa em andamento
 *     node scripts/estado.js --nota ""            # apaga a anotação
 *
 * ## Por que existe
 *
 * Sessão do Claude Code não tem memória entre execuções, e a que estoura o
 * limite de uso morre no meio da tarefa — sem aviso, sem resumo. O que sobra é
 * o que estiver em disco. Já aconteceu de sobrar por acaso: um ADR escrito mas
 * não commitado, o roadmap já marcado, e a sessão seguinte remontando a
 * história pelo `git log`. Deu certo por sorte — dez minutos antes, o ADR só
 * existiria no contexto que morreu junto.
 *
 * Então este script escreve o que dá para derivar sozinho:
 *
 *   - o estado da árvore (branch, divergência com o origin, o que não foi
 *     commitado, os últimos commits);
 *   - o placar do backlog lido de `docs/roadmap/roadmap.html`, a fonte de
 *     dados das 199 tarefas;
 *   - a fila do que vem em seguida, por prioridade.
 *
 * E carrega o que **não** dá para derivar — a intenção: em que tarefa se
 * estava, o que faltava — do arquivo de nota que `--nota` escreve.
 *
 * O arquivo gerado fica no `.gitignore`. Ele é reescrito a cada fim de turno
 * pelo hook `Stop`, e um arquivo versionado que muda a cada turno deixaria a
 * árvore permanentemente suja — brigando justamente com o fluxo de commit que
 * ele existe para proteger. O status compartilhável já é o backlog de issues
 * no GitHub, que `sincronizar-issues.js` mantém em dia.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { MILESTONE, lerTarefas } = require('./lib/roadmap');

/** Raiz do git, que é um nível acima da raiz do app (o repo tem outros dirs). */
const raizGit = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: __dirname,
  encoding: 'utf8',
}).trim();

const dirClaude = path.join(raizGit, '.claude');
const caminhoEstado = path.join(dirClaude, 'estado.md');
const caminhoNota = path.join(dirClaude, 'estado-nota.txt');

/** Git nunca derruba a geração: sem resposta, a seção sai vazia. */
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: raizGit,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

// --- nota manual -----------------------------------------------------------

const argv = process.argv.slice(2);
const iNota = argv.indexOf('--nota');

if (iNota >= 0) {
  const texto = argv
    .slice(iNota + 1)
    .join(' ')
    .trim();
  if (texto) {
    fs.mkdirSync(dirClaude, { recursive: true });
    fs.writeFileSync(caminhoNota, `${texto}\n`, 'utf8');
  } else {
    fs.rmSync(caminhoNota, { force: true });
  }
}

const nota = fs.existsSync(caminhoNota)
  ? fs.readFileSync(caminhoNota, 'utf8').trim()
  : '';
const notaEm = fs.existsSync(caminhoNota)
  ? fs.statSync(caminhoNota).mtime
  : null;

// --- árvore ----------------------------------------------------------------

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const upstream = git(
  'rev-parse',
  '--abbrev-ref',
  '--symbolic-full-name',
  '@{u}',
);
const ahead = upstream ? git('rev-list', '--count', '@{u}..HEAD') : '';
const behind = upstream ? git('rev-list', '--count', 'HEAD..@{u}') : '';
const sujo = git('status', '--porcelain').split('\n').filter(Boolean);
const commits = git('log', '-8', '--format=%h %s').split('\n').filter(Boolean);

// --- backlog ---------------------------------------------------------------

const tarefas = lerTarefas();
const abertas = tarefas.filter((t) => !t.feita);
const feitas = tarefas.length - abertas.length;

const ordemFluxo = Object.keys(MILESTONE);
const porFluxo = ordemFluxo
  .map((k) => ({
    fluxo: MILESTONE[k],
    feitas: tarefas.filter((t) => t.bloco === k && t.feita).length,
    total: tarefas.filter((t) => t.bloco === k).length,
  }))
  .filter((l) => l.total > 0);

/** P0 antes de P1, e dentro da prioridade a ordem dos fluxos no roadmap. */
const porPrioridadeEFluxo = (a, b) =>
  Number(a.prioridade) - Number(b.prioridade) ||
  ordemFluxo.indexOf(a.bloco) - ordemFluxo.indexOf(b.bloco);

const daIa = abertas
  .filter((t) => t.quem !== 'voce')
  .sort(porPrioridadeEFluxo)
  .slice(0, 12);

const suas = abertas
  .filter((t) => t.quem === 'voce')
  .sort(porPrioridadeEFluxo)
  .slice(0, 6);

// --- escrita ---------------------------------------------------------------

const agora = new Date().toLocaleString('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const linhaTarefa = (t) =>
  `| ${t.id} | P${t.prioridade} | ${t.titulo} | ${MILESTONE[t.bloco]} |`;

const out = [
  '# Estado da sessão — TrincaMania ODS 12',
  '',
  `_Gerado por \`scripts/estado.js\` em ${agora}. Não editar à mão:_`,
  '_o hook `Stop` reescreve este arquivo ao fim de cada turno._',
  '',
  '## Em andamento',
  '',
  nota
    ? `${nota}\n\n_(anotado em ${notaEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} — se for mais velho que os commits abaixo, confie nos commits)_`
    : '_Nada anotado._ Se a árvore estiver suja, o trabalho em andamento é o que\naparece em "não commitado" abaixo.',
  '',
  '## Árvore',
  '',
  branch
    ? `Branch \`${branch}\`${
        upstream
          ? ` — ${ahead} commit(s) à frente / ${behind} atrás de \`${upstream}\`.`
          : ' — sem branch remota.'
      }`
    : '_Sem repositório git._',
  '',
  ...(sujo.length
    ? [
        `**Não commitado (${sujo.length}):**`,
        '',
        ...sujo.slice(0, 25).map((l) => `- \`${l}\``),
        ...(sujo.length > 25 ? [`- _…e mais ${sujo.length - 25}._`] : []),
      ]
    : ['Árvore limpa.']),
  '',
  '**Últimos commits:**',
  '',
  ...commits.map((c) => `- \`${c}\``),
  '',
  '## Backlog',
  '',
  `${feitas} de ${tarefas.length} tarefas feitas (${Math.round((feitas / tarefas.length) * 100)}%) — ${abertas.length} abertas.`,
  '',
  '| Fluxo | Feitas | Total |',
  '| --- | --- | --- |',
  ...porFluxo.map((l) => `| ${l.fluxo} | ${l.feitas} | ${l.total} |`),
  '',
  '## Fila do Claude Code',
  '',
  ...(daIa.length
    ? [
        '| ID | P | Tarefa | Fluxo |',
        '| --- | --- | --- | --- |',
        ...daIa.map(linhaTarefa),
      ]
    : ['_Nada aberto para a IA._']),
  '',
  '## Esperando você',
  '',
  ...(suas.length
    ? [
        '| ID | P | Tarefa | Fluxo |',
        '| --- | --- | --- | --- |',
        ...suas.map(linhaTarefa),
      ]
    : ['_Nada bloqueado em você._']),
  '',
];

fs.mkdirSync(dirClaude, { recursive: true });
fs.writeFileSync(caminhoEstado, out.join('\n'), 'utf8');

if (process.stdout.isTTY) {
  console.log(
    `${path.relative(raizGit, caminhoEstado)}: ${feitas}/${tarefas.length} feitas, ${sujo.length} arquivo(s) sujo(s)${nota ? ', nota presente' : ''}`,
  );
}
