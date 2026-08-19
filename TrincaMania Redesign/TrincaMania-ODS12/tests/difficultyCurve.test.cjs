const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

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

const { curveProgress, LINEAR_DIFFICULTY_CURVE } = require('../src/utils/difficultyCurve.ts');

// Curvas usadas de verdade pelos mundos 4-8 e pelos 10 capítulos (ver
// GENERATED_WORLD_CONFIGS em levels.ts e CHAPTER_BLUEPRINTS em chapters.ts),
// mais a curva neutra — cobre tanto o caso que gerou o bug original quanto
// os parâmetros reais em produção.
const REAL_CURVES = [
  LINEAR_DIFFICULTY_CURVE,
  { gamma: 1.3, blockGrowth: 1.15 },
  { gamma: 1.5, blockGrowth: 1.2 },
  { gamma: 1.7, blockGrowth: 1.25 },
  { gamma: 1.9, blockGrowth: 1.3 },
  { gamma: 2.2, blockGrowth: 1.4 },
  { gamma: 1.2, blockGrowth: 1.1 },
  { gamma: 2.0, blockGrowth: 1.26 },
];

// (total, blockSize) combinados de verdade: mundos (25, 5) e capítulos
// (100, 10), mais um caso onde blockSize não divide total, pra exercitar o
// último bloco encurtado.
const SHAPES = [
  { total: 25, blockSize: 5 },
  { total: 100, blockSize: 10 },
  { total: 23, blockSize: 5 },
];

test('curveProgress é estritamente crescente em todo position, inclusive nas fronteiras de bloco', () => {
  for (const shape of SHAPES) {
    for (const curve of REAL_CURVES) {
      let previous = -Infinity;
      for (let position = 1; position <= shape.total; position += 1) {
        const value = curveProgress(position, shape.total, shape.blockSize, curve);
        assert.ok(
          value > previous,
          `curveProgress deveria crescer estritamente: position=${position} deu ${value}, ` +
            `mas position anterior deu ${previous} (total=${shape.total}, blockSize=${shape.blockSize}, ` +
            `curve=${JSON.stringify(curve)})`,
        );
        previous = value;
      }
    }
  }
});

test('regressão: última posição de um bloco não empata mais com a primeira do próximo', () => {
  // Caso exato que expôs o bug: blockSize=10 divide total=100, gamma=1,
  // blockGrowth=1 — antes da correção, curveProgress(10,...) === curveProgress(11,...).
  const atBlockEnd = curveProgress(10, 100, 10, LINEAR_DIFFICULTY_CURVE);
  const atNextBlockStart = curveProgress(11, 100, 10, LINEAR_DIFFICULTY_CURVE);

  assert.notEqual(atBlockEnd, atNextBlockStart);
  assert.ok(atBlockEnd < atNextBlockStart);
});

test('extremos: position=1 é exatamente 0, position=total é exatamente 1', () => {
  for (const shape of SHAPES) {
    for (const curve of REAL_CURVES) {
      const first = curveProgress(1, shape.total, shape.blockSize, curve);
      const last = curveProgress(shape.total, shape.total, shape.blockSize, curve);

      assert.equal(first, 0);
      assert.equal(last, 1);
    }
  }
});

test('total <= 1 sempre retorna 0, sem dividir por zero', () => {
  assert.equal(curveProgress(1, 1, 5, LINEAR_DIFFICULTY_CURVE), 0);
  assert.equal(curveProgress(1, 0, 5, LINEAR_DIFFICULTY_CURVE), 0);
});
