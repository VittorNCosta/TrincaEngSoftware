// node:test carrega TS com hooks locais. Recompilar na fronteira _compile
// conserva esses hooks/mocks e garante source maps reais para o c8.
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const original = Module.prototype._compile;
const src = path.resolve(__dirname, '../src') + path.sep;
Module.prototype._compile = function (code, filename) {
  if (filename.startsWith(src) && /\.tsx?$/.test(filename)) {
    code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        inlineSourceMap: true,
        inlineSources: true,
      },
    }).outputText;
  }
  return original.call(this, code, filename);
};
