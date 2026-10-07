const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};
const {
  createVisitorStorage,
  createBrowserTestStorage,
} = require('../src/storage/webSessionStorage.ts');
test('novo visitante começa sem campanha, capítulos, vidas, preferências ou itens do anterior', async () => {
  const first = createVisitorStorage();
  const keys = ['campaign', 'chapters', 'lives', 'settings', 'rescue', 'tray'];
  await Promise.all(
    keys.map((key) => first.setItem(key, JSON.stringify({ progress: 4 }))),
  );
  const next = createVisitorStorage();
  for (const key of keys) {
    assert.notEqual(await first.getItem(key), null);
    assert.equal(await next.getItem(key), null);
  }
});
test('modo teste persiste entre instâncias e mantém as chaves originais intactas', async () => {
  const backend = createVisitorStorage();
  await backend.setItem('campaign', 'save original');
  const first = createBrowserTestStorage(backend);
  await first.setItem('campaign', 'save de testes');
  const next = createBrowserTestStorage(backend);
  assert.equal(await next.getItem('campaign'), 'save de testes');
  assert.equal(await backend.getItem('campaign'), 'save original');
  assert.equal(
    await backend.getItem('@trinca-web-test/campaign'),
    'save de testes',
  );
});
test('escritas da feira não acessam o save persistente de testes', async () => {
  const backend = createVisitorStorage();
  const tests = createBrowserTestStorage(backend);
  await tests.setItem('settings', 'som desligado');
  const visitor = createVisitorStorage();
  await visitor.setItem('settings', 'som ligado');
  assert.equal(await tests.getItem('settings'), 'som desligado');
  assert.equal(await visitor.getItem('settings'), 'som ligado');
});
