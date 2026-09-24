/**
 * Gera o script de criação **inicial** das issues a partir do array `BLOCKS` de
 * `docs/roadmap/roadmap.html` — o mesmo arquivo publicado como Artifact.
 *
 * O roadmap vive em três lugares (doc markdown, Artifact, backlog do GitHub) e
 * os três precisam contar a mesma história. O HTML é a fonte de dados.
 *
 *   node scripts/gerar-issues-roadmap.js
 *
 * Tarefa com título começando em ✅ vira issue já fechada, para o backlog
 * refletir o que aconteceu antes de ele existir.
 *
 * ## Isto é para o dia zero. Depois use o sincronizador.
 *
 * O `.sh` gerado aqui **cria** issue; ele não sabe o que já existe, então rodar
 * duas vezes duplica as 199. Serviu para levantar o backlog de uma vez e
 * continua servindo se ele precisar ser recriado do zero.
 *
 * Para o uso do dia a dia — marcar tarefa feita, acrescentar tarefa nova,
 * corrigir um título — o que reconcilia por delta é:
 *
 *     node scripts/sincronizar-issues.js            # mostra o que mudaria
 *     node scripts/sincronizar-issues.js --aplicar  # aplica
 *
 * O que decide título, corpo e labels de uma tarefa está em `scripts/lib/roadmap.js`,
 * compartilhado pelos dois — se cada um montasse do seu jeito, o sincronizador
 * acusaria divergência em toda issue já na primeira execução.
 */
const fs = require('node:fs');
const path = require('node:path');

const {
  LABELS,
  MILESTONE,
  lerBlocos,
  lerTarefas,
  repoRoot,
  toMarkdown,
} = require('./lib/roadmap');

const input =
  process.argv[2] ?? path.join(repoRoot, 'docs/roadmap/roadmap.html');
const output =
  process.argv[3] ?? path.join(repoRoot, 'scripts/criar-issues-roadmap.sh');

const blocos = lerBlocos(input);
const tarefas = lerTarefas(input);

/** Aspas simples dentro de string bash com aspas simples. */
const shq = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const lines = [
  '#!/usr/bin/env bash',
  '# NÃO EDITE À MÃO. Gerado por scripts/gerar-issues-roadmap.js a partir de',
  '# docs/roadmap/roadmap.html — TrincaMania ODS 12',
  '# Requer: gh instalado e autenticado (gh auth login)',
  '# Idempotência: rodar duas vezes cria issues duplicadas. Rode uma vez só.',
  '# Para reconciliar um backlog que já existe, use scripts/sincronizar-issues.js.',
  'set -euo pipefail',
  'REPO="VittorNCosta/TrincaEngSoftware"',
  '',
  'echo "== labels =="',
];

LABELS.forEach(([name, color]) => {
  lines.push(
    `gh label create ${shq(name)} --repo "$REPO" --color ${color} --force >/dev/null`,
  );
});

lines.push(
  '',
  'echo "== milestones =="',
  'ms() { gh api -X POST "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null 2>&1 || true; }',
);

blocos.forEach((block) => {
  lines.push(
    `ms ${shq(MILESTONE[block.k])} ${shq(toMarkdown(block.note).slice(0, 240))}`,
  );
});

lines.push(
  '',
  '# Cria a issue e, quando a tarefa já foi concluída, fecha em seguida.',
  'mk() {',
  '  local done="$1"; shift',
  '  local url',
  '  url="$(gh issue create --repo "$REPO" "$@")"',
  '  echo "  $url"',
  '  if [ "$done" = "done" ]; then',
  '    gh issue close "$url" --repo "$REPO" --reason completed --comment "Concluída antes da criação do backlog — ver o corpo da issue." >/dev/null',
  '  fi',
  '}',
  '',
  'echo "== issues =="',
);

let blocoAtual = null;
let closed = 0;

tarefas.forEach((tarefa) => {
  if (tarefa.bloco !== blocoAtual) {
    blocoAtual = tarefa.bloco;
    lines.push('', `# --- ${tarefa.milestone} ---`);
  }

  if (tarefa.feita) {
    closed += 1;
  }

  lines.push(
    `mk ${tarefa.feita ? 'done' : 'open'} --title ${shq(tarefa.tituloIssue)} \\`,
    `  --body ${shq(tarefa.corpo)} \\`,
    `  --label ${shq(tarefa.labels)} --milestone ${shq(tarefa.milestone)}`,
  );
});

lines.push(
  '',
  `echo "== pronto: ${tarefas.length} issues (${closed} já criadas fechadas) =="`,
  '',
);

fs.writeFileSync(output, lines.join('\n'), { mode: 0o755 });
console.log(
  `${tarefas.length} issues, ${closed} já fechadas → ${path.relative(repoRoot, output)}`,
);
