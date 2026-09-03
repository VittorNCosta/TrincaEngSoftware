/**
 * Gera o script de criação das issues a partir do array `BLOCKS` de
 * `docs/roadmap/roadmap.html` — o mesmo arquivo publicado como Artifact.
 *
 * O roadmap vive em três lugares (doc markdown, Artifact, backlog do GitHub) e
 * os três precisam contar a mesma história. O HTML é a fonte de dados: quem
 * marca uma tarefa como feita ou acrescenta uma nova mexe nele e roda
 *
 *   node scripts/gerar-issues-roadmap.js
 *
 * Tarefa com título começando em ✅ vira issue já fechada, para o backlog
 * refletir o que aconteceu antes de ele existir.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const input = process.argv[2] ?? path.join(repoRoot, 'docs/roadmap/roadmap.html');
const output =
  process.argv[3] ?? path.join(repoRoot, 'scripts/criar-issues-roadmap.sh');

const html = fs.readFileSync(input, 'utf8');

// Recorta o literal `const BLOCKS = [ ... ];` e avalia como JS.
const start = html.indexOf('const BLOCKS = [');
const end = html.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('BLOCKS não encontrado em roadmap.html');
const BLOCKS = eval(html.slice(start + 'const BLOCKS = '.length, end + 2));

const LABELS = [
  ['fundacao', '5E6862'],
  ['conteudo', '00803B'],
  ['arte', 'C8121B'],
  ['som', 'B98A00'],
  ['limpeza-ods12', '7B3F00'],
  ['git', '0055A4'],
  ['ci-cd', '2F6478'],
  ['devsecops', 'CC5F00'],
  ['qualidade', '574E6B'],
  ['release', '0E6F6B'],
  ['P0', 'D73A4A'],
  ['P1', 'E5A000'],
  ['P2', 'BFC7C2'],
  ['claude-code', '0E8A6B'],
  ['humano', '8A4FBE'],
];

const STREAM_LABEL = {
  f0: 'fundacao',
  c: 'conteudo',
  a: 'arte',
  s: 'som',
  l: 'limpeza-ods12',
  g: 'git',
  ci: 'ci-cd',
  sec: 'devsecops',
  q: 'qualidade',
  r: 'release',
};

const MILESTONE = {
  f0: 'Fundação',
  c: 'Conteúdo 10×10',
  a: 'Arte',
  s: 'Som',
  l: 'Limpeza ODS12',
  g: 'Git e versionamento',
  ci: 'CI/CD',
  sec: 'DevSecOps',
  q: 'Qualidade',
  r: 'Release',
};

const WHO_LABEL = {
  cc: 'claude-code',
  voce: 'humano',
  both: 'claude-code,humano',
  'cc-voce': 'claude-code',
  'voce-cc': 'humano',
};

const WHO_TEXT = {
  cc: 'Claude Code',
  voce: 'Você',
  both: 'Claude Code + Você',
  'cc-voce': 'Claude Code → você',
  'voce-cc': 'Você → Claude Code',
};

/** HTML dos detalhes → markdown de issue. */
const toMarkdown = (value) =>
  String(value ?? '')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Aspas simples dentro de string bash com aspas simples. */
const shq = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const lines = [
  '#!/usr/bin/env bash',
  '# NÃO EDITE À MÃO. Gerado por scripts/gerar-issues-roadmap.js a partir de',
  '# docs/roadmap/roadmap.html — TrincaMania ODS 12',
  '# Requer: gh instalado e autenticado (gh auth login)',
  '# Idempotência: rodar duas vezes cria issues duplicadas. Rode uma vez só.',
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

BLOCKS.forEach((block) => {
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

let total = 0;
let closed = 0;

BLOCKS.forEach((block) => {
  lines.push('', `# --- ${MILESTONE[block.k]} ---`);

  block.t.forEach(([id, rawTitle, who, prio, detail]) => {
    total += 1;
    const isDone = rawTitle.startsWith('✅');
    if (isDone) closed += 1;
    const title = toMarkdown(rawTitle.replace(/^✅\s*/, ''));
    const body = [
      toMarkdown(detail) || '_Sem detalhe adicional no roadmap._',
      '',
      `**Responsável:** ${WHO_TEXT[who]}`,
      `**Prioridade:** P${prio}`,
      `**Fluxo:** ${MILESTONE[block.k]}`,
      '',
      'Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.',
    ].join('\n');
    if (!WHO_LABEL[who] || !WHO_TEXT[who]) {
      throw new Error(`"${id}": valor de "quem" sem mapeamento em WHO_LABEL/WHO_TEXT: ${JSON.stringify(who)}`);
    }
    const labels = [STREAM_LABEL[block.k], `P${prio}`, WHO_LABEL[who]].join(',');

    lines.push(
      `mk ${isDone ? 'done' : 'open'} --title ${shq(`${id} · ${title}`)} \\`,
      `  --body ${shq(body)} \\`,
      `  --label ${shq(labels)} --milestone ${shq(MILESTONE[block.k])}`,
    );
  });
});

lines.push(
  '',
  `echo "== pronto: ${total} issues (${closed} já criadas fechadas) =="`,
  '',
);

fs.writeFileSync(output, lines.join('\n'), { mode: 0o755 });
console.log(`${total} issues, ${closed} já fechadas → ${path.relative(repoRoot, output)}`);
