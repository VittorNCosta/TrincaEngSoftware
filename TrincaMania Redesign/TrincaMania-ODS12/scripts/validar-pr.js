/** Gate de entrega: verifica o SHA local no PR e aguarda os checks remotos. */
const { execFileSync } = require('node:child_process');

const WORKFLOWS = ['CI', 'Seguranca'];
const TERMINAIS_OK = new Set(['SUCCESS', 'SKIPPED', 'NEUTRAL']);

const avaliar = (pr, runs, sha) => {
  if (pr.headRefOid !== sha)
    return {
      estado: 'falha',
      motivo: 'O HEAD local não é o commit publicado no PR.',
    };
  if (pr.mergeable === 'CONFLICTING')
    return { estado: 'falha', motivo: 'O PR tem conflitos com a branch base.' };

  const atuais = runs.filter((run) => run.headSha === sha);
  // O push e o evento de PR podem criar execuções distintas. Exigimos ambos
  // quando presentes; só a execução mais recente por workflow/evento vale.
  const ultimas = new Map();
  for (const run of atuais) {
    const key = `${run.workflowName}:${run.event}`;
    const anterior = ultimas.get(key);
    if (!anterior || run.databaseId > anterior.databaseId)
      ultimas.set(key, run);
  }
  const obrigatorias = [...ultimas.values()].filter((r) =>
    WORKFLOWS.includes(r.workflowName),
  );
  const erros = obrigatorias.filter(
    (r) => r.status === 'completed' && r.conclusion !== 'success',
  );
  const checks = pr.statusCheckRollup || [];
  const checksRuins = checks.filter((c) =>
    c.__typename === 'StatusContext'
      ? ['ERROR', 'FAILURE'].includes(c.state)
      : c.status === 'COMPLETED' && !TERMINAIS_OK.has(c.conclusion),
  );
  if (erros.length || checksRuins.length)
    return {
      estado: 'falha',
      motivo: [
        ...erros.map((r) => `${r.workflowName}: ${r.conclusion} — ${r.url}`),
        ...checksRuins.map(
          (c) =>
            `${c.name || c.context}: ${c.conclusion || c.state} — ${c.detailsUrl || c.targetUrl || ''}`,
        ),
      ].join('\n'),
    };

  const faltantes = WORKFLOWS.filter(
    (name) => !obrigatorias.some((r) => r.workflowName === name),
  );
  const pendentes = obrigatorias.some((r) => r.status !== 'completed');
  const checksPendentes = checks.some((c) =>
    c.__typename === 'StatusContext'
      ? c.state !== 'SUCCESS'
      : c.status !== 'COMPLETED',
  );
  if (
    faltantes.length ||
    pendentes ||
    checksPendentes ||
    !checks.length ||
    pr.mergeable !== 'MERGEABLE'
  )
    return {
      estado: 'pendente',
      motivo: faltantes.length
        ? `Aguardando workflows do SHA atual: ${faltantes.join(', ')}.`
        : 'Aguardando checks ou cálculo de conflitos do GitHub.',
    };
  return {
    estado: 'sucesso',
    motivo: `Checks aprovados para ${sha}. ${pr.url}`,
  };
};

const executar = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 8 * 1024 * 1024,
  }).trim();

const monitorar = async ({
  consultar,
  sha,
  watch = false,
  agora = Date.now,
  esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  informar = console.log,
  prazoMs = 30 * 60 * 1000,
}) => {
  const limite = agora() + prazoMs;
  for (;;) {
    const { pr, runs } = await consultar();
    const resultado = avaliar(pr, runs, sha);
    informar(`[${resultado.estado}] ${resultado.motivo}`);
    if (resultado.estado === 'sucesso') return 0;
    if (resultado.estado === 'falha') return 1;
    if (!watch || agora() >= limite) return 2;
    await esperar(15000);
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const numero = args[0];
  if (!/^\d+$/.test(numero || '') || args.slice(1).some((a) => a !== '--watch'))
    throw new Error('Uso: npm run pr:validar -- <numero> [--watch]');
  const repo = 'VittorNCosta/TrincaEngSoftware';
  const sha = executar('git', ['rev-parse', 'HEAD']);
  const consultar = () => {
    const pr = JSON.parse(
      executar('gh', [
        'pr',
        'view',
        numero,
        '--repo',
        repo,
        '--json',
        'headRefOid,mergeable,statusCheckRollup,url',
      ]),
    );
    const runs = JSON.parse(
      executar('gh', [
        'run',
        'list',
        '--repo',
        repo,
        '--commit',
        sha,
        '--limit',
        '100',
        '--json',
        'databaseId,headSha,workflowName,event,status,conclusion,url',
      ]),
    );
    return { pr, runs };
  };
  process.exitCode = await monitorar({
    consultar,
    sha,
    watch: args.includes('--watch'),
  });
  if (process.exitCode === 1)
    console.error(
      'Leia os logs com gh run view <id> --log-failed; corrija, valide e publique um novo commit.',
    );
};

module.exports = { avaliar, monitorar };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
