/**
 * O hook de `require` para `.ts` usado pelos testes de `node:test`.
 *
 * Os testes são `.cjs` rodando no Node puro, sem bundler, e o código que eles
 * exercitam é TypeScript. Transpilar na hora do `require` é o que dispensa um
 * passo de build antes de testar — e é por isso que a suíte de domínio roda em
 * segundos.
 *
 * Existem 17 cópias deste mesmo hook espalhadas pelos `tests/*.test.cjs`
 * antigos. Arquivo novo usa esta, e a duplicação vai secando conforme cada um
 * for tocado por outro motivo; reescrever os 17 de uma vez só para deduplicar
 * encheria o diff de ruído sem mudar comportamento nenhum.
 */
const fs = require('node:fs');
const ts = require('typescript');

/** Idempotente: vários módulos podem chamar no mesmo processo. */
const registrarTypeScript = () => {
  if (require.extensions['.ts']) {
    return;
  }

  require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    }).outputText;

    module._compile(output, filename);
  };
};

module.exports = { registrarTypeScript };
