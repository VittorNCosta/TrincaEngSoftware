#!/usr/bin/env node
/**
 * Reconcilia o backlog do GitHub com `docs/roadmap/roadmap.html`, por delta.
 *
 *     node scripts/sincronizar-issues.js            # relatório; não muda nada
 *     node scripts/sincronizar-issues.js --aplicar  # executa o delta
 *
 * ## Por que existe
 *
 * `gerar-issues-roadmap.js` resolve o dia zero: ele **cria** as 199 issues. O
 * próprio `.sh` avisa que rodar duas vezes duplica tudo, porque ele não olha
 * para o que já existe. Só que o trabalho do dia a dia não é criar backlog do
 * zero — é marcar uma tarefa como feita, acrescentar uma tarefa nova, corrigir
 * um título que mudou. Isso vinha sendo reconciliado à mão, issue por issue.
 *
 * Aqui a conta é de diferença: lê o roadmap, lê o estado real do GitHub e
 * calcula o que falta para os dois baterem.
 *
 * | Situação                                   | O que faz          |
 * | ------------------------------------------ | ------------------ |
 * | Tarefa no roadmap sem issue                | cria               |
 * | Tarefa ✅ com issue aberta                  | fecha              |
 * | Tarefa não-✅ com issue fechada             | reabre             |
 * | Título, corpo ou labels divergentes        | edita              |
 * | Issue cujo id não existe mais no roadmap   | **só avisa**       |
 * | Duas issues com o mesmo id                 | **só avisa**       |
 *
 * As duas últimas não são automatizadas de propósito: as duas destroem
 * trabalho se o script errar o diagnóstico, e nas duas a decisão certa depende
 * de contexto que o roadmap não tem — a issue órfã pode ser trabalho legítimo
 * que ninguém registrou, e entre duas duplicadas quem escolhe qual sobrevive é
 * quem leu as duas.
 *
 * ## Sem `--aplicar` ele também serve de verificação
 *
 * Em modo relatório o script sai com código 1 quando existe divergência, o que
 * o torna usável como passo de CI: o roadmap deixa de poder mentir em silêncio
 * sobre o que já foi feito.
 */
const { spawnSync } = require('node:child_process');

const { LABELS, idDoTitulo, lerTarefas } = require('./lib/roadmap');

const REPO_PADRAO = 'VittorNCosta/TrincaEngSoftware';

const argv = process.argv.slice(2);
const aplicar = argv.includes('--aplicar');
const repo = (() => {
  const i = argv.indexOf('--repo');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : REPO_PADRAO;
})();

/** Labels que este script administra. Qualquer outra é de quem a pôs lá. */
const LABELS_GERENCIADAS = new Set(LABELS.map(([nome]) => nome));

const gh = (args, { silencioso = false } = {}) => {
  const r = spawnSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (r.error) {
    throw new Error(`não foi possível executar o gh: ${r.error.message}`);
  }

  if (r.status !== 0) {
    if (!silencioso) {
      console.error(
        `  ✖ gh ${args.slice(0, 3).join(' ')} — ${r.stderr.trim()}`,
      );
    }
    return { ok: false, saida: '', erro: r.stderr.trim() };
  }

  return { ok: true, saida: r.stdout, erro: '' };
};

/** Fim de linha do GitHub vem como CRLF; comparar sem normalizar acusaria tudo. */
const normalizar = (texto) =>
  String(texto ?? '')
    .replace(/\r\n/g, '\n')
    .trim();

const lerIssues = () => {
  const r = gh([
    'issue',
    'list',
    '--repo',
    repo,
    '--state',
    'all',
    '--limit',
    '1000',
    '--json',
    'number,title,state,body,labels',
  ]);

  if (!r.ok) {
    console.error(
      '\nNão foi possível ler as issues. `gh auth status` para conferir o login.',
    );
    process.exit(1);
  }

  return JSON.parse(r.saida);
};

const main = () => {
  const tarefas = lerTarefas();
  const issues = lerIssues();

  const porId = new Map();
  const duplicadas = [];
  const orfas = [];

  for (const issue of issues) {
    const id = idDoTitulo(issue.title);

    if (!id) {
      continue;
    }

    if (porId.has(id)) {
      duplicadas.push({ id, issues: [porId.get(id).number, issue.number] });
      continue;
    }

    porId.set(id, issue);
  }

  const idsDoRoadmap = new Set(tarefas.map((t) => t.id));

  for (const [id, issue] of porId) {
    if (!idsDoRoadmap.has(id)) {
      orfas.push({ id, numero: issue.number, titulo: issue.title });
    }
  }

  const criar = [];
  const fechar = [];
  const reabrir = [];
  const editar = [];

  for (const tarefa of tarefas) {
    const issue = porId.get(tarefa.id);

    if (!issue) {
      criar.push(tarefa);
      continue;
    }

    const aberta = issue.state.toUpperCase() === 'OPEN';

    if (tarefa.feita && aberta) {
      fechar.push({ tarefa, issue });
    } else if (!tarefa.feita && !aberta) {
      reabrir.push({ tarefa, issue });
    }

    const mudancas = [];

    if (normalizar(issue.title) !== normalizar(tarefa.tituloIssue)) {
      mudancas.push('título');
    }

    if (normalizar(issue.body) !== normalizar(tarefa.corpo)) {
      mudancas.push('corpo');
    }

    const atuais = new Set(issue.labels.map((l) => l.name));
    const esperadas = new Set(tarefa.labels.split(','));
    const faltando = [...esperadas].filter((l) => !atuais.has(l));
    // Só remove label do conjunto que este script administra: label posta a mão
    // (`bug`, `accessibility`) não é divergência, é informação a mais.
    const sobrando = [...atuais].filter(
      (l) => LABELS_GERENCIADAS.has(l) && !esperadas.has(l),
    );

    if (faltando.length > 0 || sobrando.length > 0) {
      mudancas.push('labels');
    }

    if (mudancas.length > 0) {
      editar.push({ tarefa, issue, mudancas, faltando, sobrando });
    }
  }

  const total = criar.length + fechar.length + reabrir.length + editar.length;

  console.log(`roadmap ${tarefas.length} | github ${porId.size}\n`);

  const listar = (rotulo, itens, formatar) => {
    if (itens.length === 0) {
      console.log(`${rotulo.padEnd(10)}: nenhuma`);
      return;
    }

    console.log(`${rotulo.padEnd(10)}: ${itens.length}`);
    for (const item of itens) {
      console.log(`   ${formatar(item)}`);
    }
  };

  listar('criar', criar, (t) => `${t.id} · ${t.titulo}`);
  listar(
    'fechar',
    fechar,
    ({ tarefa, issue }) => `#${issue.number} ${tarefa.id}`,
  );
  listar(
    'reabrir',
    reabrir,
    ({ tarefa, issue }) => `#${issue.number} ${tarefa.id}`,
  );
  listar(
    'editar',
    editar,
    ({ tarefa, issue, mudancas }) =>
      `#${issue.number} ${tarefa.id} (${mudancas.join(', ')})`,
  );
  listar('órfã', orfas, (o) => `#${o.numero} ${o.titulo} — decida à mão`);
  listar(
    'duplicada',
    duplicadas,
    (d) => `${d.id} em #${d.issues.join(' e #')} — decida à mão`,
  );

  if (!aplicar) {
    console.log(
      total === 0
        ? '\n✔ backlog em sincronia com o roadmap.'
        : `\n${total} mudança(s) pendente(s). Para aplicar:\n  node scripts/sincronizar-issues.js --aplicar`,
    );
    process.exit(total === 0 ? 0 : 1);
  }

  if (total === 0) {
    console.log('\n✔ nada a aplicar.');
    return;
  }

  console.log('\n== aplicando ==');
  let falhas = 0;

  for (const tarefa of criar) {
    const r = gh([
      'issue',
      'create',
      '--repo',
      repo,
      '--title',
      tarefa.tituloIssue,
      '--body',
      tarefa.corpo,
      '--label',
      tarefa.labels,
      '--milestone',
      tarefa.milestone,
    ]);

    if (!r.ok) {
      falhas += 1;
      continue;
    }

    const url = r.saida.trim();
    console.log(`  criada  ${tarefa.id}  ${url}`);

    if (tarefa.feita) {
      const f = gh([
        'issue',
        'close',
        url,
        '--repo',
        repo,
        '--reason',
        'completed',
        '--comment',
        'Concluída — ver o corpo da issue, sincronizado a partir do roadmap.',
      ]);
      if (!f.ok) {
        falhas += 1;
      }
    }
  }

  for (const { tarefa, issue } of fechar) {
    const r = gh([
      'issue',
      'close',
      String(issue.number),
      '--repo',
      repo,
      '--reason',
      'completed',
      '--comment',
      'Concluída — ver o corpo da issue, sincronizado a partir do roadmap.',
    ]);
    if (r.ok) {
      console.log(`  fechada #${issue.number} ${tarefa.id}`);
    } else {
      falhas += 1;
    }
  }

  for (const { tarefa, issue } of reabrir) {
    const r = gh(['issue', 'reopen', String(issue.number), '--repo', repo]);
    if (r.ok) {
      console.log(`  reaberta #${issue.number} ${tarefa.id}`);
    } else {
      falhas += 1;
    }
  }

  for (const { tarefa, issue, mudancas, faltando, sobrando } of editar) {
    const args = ['issue', 'edit', String(issue.number), '--repo', repo];

    if (mudancas.includes('título')) {
      args.push('--title', tarefa.tituloIssue);
    }

    if (mudancas.includes('corpo')) {
      args.push('--body', tarefa.corpo);
    }

    for (const label of faltando) {
      args.push('--add-label', label);
    }

    for (const label of sobrando) {
      args.push('--remove-label', label);
    }

    const r = gh(args);
    if (r.ok) {
      console.log(
        `  editada #${issue.number} ${tarefa.id} (${mudancas.join(', ')})`,
      );
    } else {
      falhas += 1;
    }
  }

  if (orfas.length > 0 || duplicadas.length > 0) {
    console.log(
      `\n${orfas.length + duplicadas.length} item(ns) precisam de decisão manual (ver acima).`,
    );
  }

  if (falhas > 0) {
    console.error(`\n✖ ${falhas} operação(ões) falharam.`);
    process.exit(1);
  }

  console.log('\n✔ backlog sincronizado.');
};

main();
