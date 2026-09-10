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
  ['observabilidade', 'B31D8C'],
  ['P0', 'D73A4A'],
  ['P1', 'E5A000'],
  ['P2', 'BFC7C2'],
  ['claude-code', '0E8A6B'],
  ['humano', '8A4FBE'],
  ['modelo-opus', '5A32A3'],
  ['modelo-sonnet', '1B7FBD'],
  ['modelo-fable', 'C2410C'],
  ['modelo-haiku', '6B7280'],
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
  o: 'observabilidade',
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
  o: 'Observabilidade',
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

const MODEL_INFO = {
  opus: { display: 'Claude Opus 5', label: 'modelo-opus' },
  sonnet: { display: 'Claude Sonnet 5', label: 'modelo-sonnet' },
  fable: { display: 'Claude Fable 5.1', label: 'modelo-fable' },
  haiku: { display: 'Claude Haiku 4.5', label: 'modelo-haiku' },
};

/**
 * Qual modelo da família Claude é o mais indicado para executar a tarefa.
 *
 * Heurística, não benchmark: dá um ponto de partida defensável por tarefa a
 * partir do que o roadmap já registra (fluxo, prioridade, responsável) — não
 * é medição de qualidade por modelo. Ajuste manual na issue sempre pode
 * sobrepor. Ordem de regras, a primeira que bater decide:
 *
 *   1. Tarefa 100% manual (`quem === 'voce'`) — nenhuma IA executa, não há
 *      recomendação.
 *   2. Fluxo de conteúdo/narrativa (`c`) — Fable, o modelo de escrita
 *      criativa da família Claude 5; texto de jogo é o caso de uso dele.
 *   3. Fluxo de segurança (`sec`) — Opus, o de maior capacidade: erro de
 *      segurança custa caro, então aqui não se otimiza por custo.
 *   4. Prioridade P0 (bloqueia o resto do roadmap) — Opus, mesmo motivo.
 *   5. Tarefa mecânica e de baixo risco (`git`/limpeza em P2) — Haiku, rápido
 *      e barato; sobraria capacidade de Sonnet/Opus para isso.
 *   6. Default — Sonnet, o equilíbrio custo/capacidade do dia a dia
 *      (implementação, QA, CI/CD, release).
 */
const recomendarModelo = ({ bloco, prioridade, quem }) => {
  if (quem === 'voce') return null;
  if (bloco === 'c') return 'fable';
  if (bloco === 'sec') return 'opus';
  if (Number(prioridade) === 0) return 'opus';
  if ((bloco === 'g' || bloco === 'l') && Number(prioridade) === 2) {
    return 'haiku';
  }
  return 'sonnet';
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
      const modelo = recomendarModelo({ bloco: bloco.k, prioridade, quem });

      tarefas.push({
        id,
        bloco: bloco.k,
        milestone,
        feita,
        prioridade,
        quem,
        modelo,
        titulo,
        tituloIssue: `${id} · ${titulo}`,
        corpo: [
          toMarkdown(detalhe) || '_Sem detalhe adicional no roadmap._',
          '',
          `**Responsável:** ${WHO_TEXT[quem]}`,
          ...(modelo
            ? [`**Modelo recomendado:** ${MODEL_INFO[modelo].display}`]
            : []),
          `**Prioridade:** P${prioridade}`,
          `**Fluxo:** ${milestone}`,
          '',
          'Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.',
        ].join('\n'),
        labels: [
          STREAM_LABEL[bloco.k],
          `P${prioridade}`,
          WHO_LABEL[quem],
          modelo ? MODEL_INFO[modelo].label : null,
        ]
          .filter(Boolean)
          .join(','),
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
  MODEL_INFO,
  STREAM_LABEL,
  WHO_LABEL,
  WHO_TEXT,
  idDoTitulo,
  lerBlocos,
  lerTarefas,
  recomendarModelo,
  repoRoot,
  toMarkdown,
};
