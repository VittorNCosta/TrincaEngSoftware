/**
 * Leitura de `docs/roadmap/roadmap.html` — a fonte de dados do roadmap.
 *
 * Existe porque dois scripts precisam da mesma resposta para "o que esta tarefa
 * vira como issue?": `gerar-issues-roadmap.js`, que escreve o `.sh` de criação
 * inicial, e `sincronizar-issues.js`, que reconcilia o backlog depois. Se cada
 * um montasse título e corpo do seu jeito, o sincronizador acharia divergência
 * em todas as 199 issues na primeira vez que rodasse — e a divergência seria
 * dele mesmo.
 *
 * Aqui não tem I/O de rede nem escrita: só HTML entra e estrutura sai.
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..');

const CAMINHO_PADRAO = path.join(repoRoot, 'docs/roadmap/roadmap.html');

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

/**
 * Recorta o literal `const BLOCKS = [ ... ];` do HTML e avalia como JS.
 *
 * É `eval` mesmo, e de propósito: o array é escrito à mão dentro da página que
 * o roadmap publica, com acento, aspas e HTML embutido. Um parser próprio
 * daria uma segunda gramática para manter em sincronia com a primeira. O
 * arquivo é versionado e escrito por quem já pode rodar qualquer script deste
 * repositório, então não há fronteira de confiança a atravessar aqui.
 */
const lerBlocos = (caminho = CAMINHO_PADRAO) => {
  const html = fs.readFileSync(caminho, 'utf8');
  const inicio = html.indexOf('const BLOCKS = [');
  const fim = html.indexOf('\n];', inicio);

  if (inicio < 0 || fim < 0) {
    throw new Error(`BLOCKS não encontrado em ${caminho}`);
  }

  return eval(html.slice(inicio + 'const BLOCKS = '.length, fim + 2));
};

/**
 * Achata os blocos numa lista de tarefas com o título, o corpo e as labels já
 * no formato que a issue tem no GitHub.
 *
 * Título com ✅ significa concluída — o prefixo sai do título da issue e vira o
 * campo `feita`, que é o que decide entre criar aberta e criar fechada.
 */
const lerTarefas = (caminho = CAMINHO_PADRAO) => {
  const blocos = lerBlocos(caminho);
  const tarefas = [];

  for (const bloco of blocos) {
    for (const [id, tituloBruto, quem, prioridade, detalhe] of bloco.t) {
      if (!WHO_LABEL[quem] || !WHO_TEXT[quem]) {
        throw new Error(
          `"${id}": valor de "quem" sem mapeamento em WHO_LABEL/WHO_TEXT: ${JSON.stringify(quem)}`,
        );
      }

      const feita = String(tituloBruto).startsWith('✅');
      const titulo = toMarkdown(String(tituloBruto).replace(/^✅\s*/, ''));
      const milestone = MILESTONE[bloco.k];

      tarefas.push({
        id,
        bloco: bloco.k,
        milestone,
        feita,
        prioridade,
        quem,
        titulo,
        tituloIssue: `${id} · ${titulo}`,
        corpo: [
          toMarkdown(detalhe) || '_Sem detalhe adicional no roadmap._',
          '',
          `**Responsável:** ${WHO_TEXT[quem]}`,
          `**Prioridade:** P${prioridade}`,
          `**Fluxo:** ${milestone}`,
          '',
          'Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.',
        ].join('\n'),
        labels: [STREAM_LABEL[bloco.k], `P${prioridade}`, WHO_LABEL[quem]].join(
          ',',
        ),
      });
    }
  }

  return tarefas;
};

/** Id da tarefa a partir do título da issue (`C-15 · Tirar o vocabulário…`). */
const idDoTitulo = (titulo) => {
  const casou = /^([A-Za-z]+\d*-[\dA-Za-z]+)\s*·/.exec(String(titulo).trim());
  return casou ? casou[1] : null;
};

module.exports = {
  CAMINHO_PADRAO,
  LABELS,
  MILESTONE,
  STREAM_LABEL,
  WHO_LABEL,
  WHO_TEXT,
  idDoTitulo,
  lerBlocos,
  lerTarefas,
  repoRoot,
  toMarkdown,
};
