const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliar, monitorar } = require('../scripts/validar-pr');

const sha = 'commit-atual';
const check = {
  __typename: 'CheckRun',
  name: 'lint',
  status: 'COMPLETED',
  conclusion: 'SUCCESS',
};
const pr = {
  headRefOid: sha,
  mergeable: 'MERGEABLE',
  statusCheckRollup: [check],
  url: 'https://example.com/pr/225',
};
const runs = ['CI', 'Seguranca'].map((workflowName, i) => ({
  workflowName,
  databaseId: i + 1,
  headSha: sha,
  event: 'pull_request',
  status: 'completed',
  conclusion: 'success',
  url: 'https://example.com/run/' + i,
}));

test('monitor aguarda a execução pendente e só retorna sucesso depois de consultar novamente', async () => {
  let consultas = 0;
  const esperas = [];
  const mensagens = [];
  const code = await monitorar({
    sha,
    watch: true,
    agora: () => 0,
    informar: (message) => mensagens.push(message),
    esperar: async (ms) => {
      esperas.push(ms);
    },
    consultar: async () => ({ pr, runs: ++consultas === 1 ? [] : runs }),
  });
  assert.equal(code, 0);
  assert.equal(consultas, 2);
  assert.deepEqual(esperas, [15000]);
  assert.match(mensagens[0], /pendente/);
  assert.match(mensagens[1], /sucesso/);
});

test('monitor para em falha, consulta única ou timeout sem inventar sucesso', async () => {
  const options = {
    sha,
    informar: () => {},
    consultar: async () => ({ pr, runs: [] }),
  };
  assert.equal(await monitorar(options), 2);
  let clock = 0;
  assert.equal(
    await monitorar({
      ...options,
      watch: true,
      prazoMs: 1000,
      agora: () => clock,
      esperar: async (ms) => {
        clock += ms;
      },
    }),
    2,
  );
  assert.equal(
    await monitorar({
      ...options,
      watch: true,
      consultar: async () => ({
        pr: { ...pr, mergeable: 'CONFLICTING' },
        runs,
      }),
    }),
    1,
  );
});

test('erro da API é propagado para o CLI reprovar, sem reutilizar o último resultado', async () => {
  await assert.rejects(
    monitorar({
      sha,
      informar: () => {},
      consultar: async () => {
        throw new Error('GitHub indisponível');
      },
    }),
    /GitHub indisponível/,
  );
});

test('só aprova com CI e Segurança completos no SHA publicado e sem conflitos', () => {
  assert.equal(avaliar(pr, runs, sha).estado, 'sucesso');
});
test('não aproveita o verde de outro commit nem confunde ausência de checks com sucesso', () => {
  assert.equal(
    avaliar(
      pr,
      runs.map((r) => ({ ...r, headSha: 'antigo' })),
      sha,
    ).estado,
    'pendente',
  );
  assert.equal(
    avaliar({ ...pr, statusCheckRollup: [] }, runs, sha).estado,
    'pendente',
  );
  assert.equal(avaliar(pr, runs.slice(0, 1), sha).estado, 'pendente');
  assert.equal(
    avaliar({ ...pr, headRefOid: 'outro' }, runs, sha).estado,
    'falha',
  );
});
test('aguarda jobs enfileirados e cálculo de merge; conflitos reprovam', () => {
  assert.equal(
    avaliar(
      pr,
      runs.map((r) => ({ ...r, status: 'queued', conclusion: '' })),
      sha,
    ).estado,
    'pendente',
  );
  assert.equal(
    avaliar({ ...pr, mergeable: 'UNKNOWN' }, runs, sha).estado,
    'pendente',
  );
  assert.equal(
    avaliar({ ...pr, mergeable: 'CONFLICTING' }, runs, sha).estado,
    'falha',
  );
  assert.equal(
    avaliar(
      {
        ...pr,
        statusCheckRollup: [
          { ...check, status: 'IN_PROGRESS', conclusion: null },
        ],
      },
      runs,
      sha,
    ).estado,
    'pendente',
  );
});
test('falha, cancelamento, timeout e workflow pulado não são aprovação', () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped'])
    assert.equal(
      avaliar(pr, [{ ...runs[0], conclusion }, runs[1]], sha).estado,
      'falha',
    );
  assert.equal(
    avaliar(
      {
        ...pr,
        statusCheckRollup: [
          {
            ...check,
            conclusion: 'FAILURE',
            detailsUrl: 'https://example.com/log',
          },
        ],
      },
      runs,
      sha,
    ).estado,
    'falha',
  );
});
test('push aprovado não esconde a falha da execução de PR e rerun mais novo substitui o anterior', () => {
  const failed = {
    ...runs[0],
    databaseId: 3,
    event: 'push',
    conclusion: 'failure',
  };
  assert.equal(avaliar(pr, [...runs, failed], sha).estado, 'falha');
  const rerun = { ...failed, databaseId: 4, conclusion: 'success' };
  assert.equal(avaliar(pr, [rerun, ...runs, failed], sha).estado, 'sucesso');
});
test('checks contextuais e jobs opcionais respeitam os estados do GitHub', () => {
  const context = {
    __typename: 'StatusContext',
    context: 'externo',
    state: 'SUCCESS',
  };
  assert.equal(
    avaliar(
      {
        ...pr,
        statusCheckRollup: [context, { ...check, conclusion: 'SKIPPED' }],
      },
      runs,
      sha,
    ).estado,
    'sucesso',
  );
  for (const state of ['ERROR', 'FAILURE'])
    assert.equal(
      avaliar({ ...pr, statusCheckRollup: [{ ...context, state }] }, runs, sha)
        .estado,
      'falha',
    );
  assert.equal(
    avaliar(
      { ...pr, statusCheckRollup: [{ ...context, state: 'PENDING' }] },
      runs,
      sha,
    ).estado,
    'pendente',
  );
});

test('push sozinho não satisfaz o workflow obrigatório de PR', () => {
  assert.equal(
    avaliar(
      pr,
      runs.map((run) => ({ ...run, event: 'push' })),
      sha,
    ).estado,
    'pendente',
  );
});
