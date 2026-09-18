const test = require('node:test');
const assert = require('node:assert/strict');
const {
  planejar,
  atualizarCorpo,
  corpoGerenciado,
  lerIssues,
} = require('../scripts/sincronizar-issues');
const tarefa = {
  id: 'G-22',
  tituloIssue: 'G-22 · Teste',
  corpo: 'escopo',
  labels: 'git',
  feita: false,
};
const issue = {
  number: 1,
  title: tarefa.tituloIssue,
  body: corpoGerenciado(tarefa.corpo),
  labels: [{ name: 'git' }, { name: 'humana' }],
  state: 'open',
};
test('nova tarefa é criada; issue automática sem ID fica fora', () => {
  const plano = planejar([tarefa], [{ ...issue, title: 'Falha automática' }]);
  assert.equal(plano.criar.length, 1);
  assert.equal(plano.orfas.length, 0);
});
test('merge fechado com roadmap pendente gera conflito, nunca reabre', () => {
  const plano = planejar([tarefa], [{ ...issue, state: 'closed' }]);
  assert.equal(plano.conflitos.length, 1);
  assert.equal(plano.fechar.length, 0);
  assert.equal('reabrir' in plano, false);
});
test('conclusão propagada após merge e PR abandonado preservam estado', () => {
  assert.equal(
    planejar([{ ...tarefa, feita: true }], [{ ...issue, state: 'closed' }])
      .conflitos.length,
    0,
  );
  assert.equal(planejar([tarefa], [issue]).fechar.length, 0);
  assert.equal(
    planejar([{ ...tarefa, feita: true }], [issue]).fechar.length,
    1,
  );
});
test('preserva texto e labels humanos; segunda execução é idempotente', () => {
  const humano = 'Anotação humana';
  const plano = planejar([tarefa], [{ ...issue, body: humano }]);
  assert.ok(plano.editar[0].corpo.startsWith(humano));
  assert.deepEqual(plano.editar[0].sobrando, []);
  assert.equal(
    planejar([tarefa], [{ ...issue, body: plano.editar[0].corpo }]).editar
      .length,
    0,
  );
  const corpo = `antes\n${corpoGerenciado('velho')}\ndepois`;
  assert.equal(
    atualizarCorpo(corpo, 'novo'),
    `antes\n${corpoGerenciado('novo')}\ndepois`,
  );
});
test('duplicadas não são editadas nem fechadas; órfãs são somente relatadas', () => {
  const plano = planejar(
    [{ ...tarefa, feita: true }],
    [
      issue,
      { ...issue, number: 2 },
      { ...issue, number: 3, title: 'G-999 · órfã' },
    ],
  );
  assert.equal(plano.duplicadas.length, 1);
  assert.equal(plano.orfas.length, 1);
  assert.equal(plano.fechar.length, 0);
  assert.equal(plano.editar.length, 0);
});
test('paginação lê todas as páginas e exclui PRs; falha parcial invalida snapshot', () => {
  const issues = lerIssues((args) => {
    assert.ok(args.includes('--paginate'));
    return {
      ok: true,
      saida: JSON.stringify([
        [issue],
        [{ ...issue, number: 2 }, { pull_request: {} }],
      ]),
    };
  });
  assert.equal(issues.length, 2);
  assert.throws(
    () => lerIssues(() => ({ ok: false, saida: JSON.stringify([[issue]]) })),
    /Nenhuma escrita/,
  );
});
test('espelhos precisam concordar antes da reconciliação', () => {
  const { validar } = require('../scripts/validar-roadmap');
  assert.deepEqual(
    validar([tarefa], '| G-22 | Teste | [CC] | P1 | texto |'),
    [],
  );
  assert.match(
    validar(
      [{ ...tarefa, feita: true }],
      '| G-22 | Teste | [CC] | P1 | texto |',
    )[0],
    /conclusão divergente/,
  );
  assert.match(validar([tarefa], '')[0], /ausente/);
  assert.match(
    validar([], '| G-22 | Teste | [CC] | P1 | texto |')[0],
    /ausente/,
  );
});
