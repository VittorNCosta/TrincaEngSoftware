const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const app = path.resolve(
  __dirname,
  "../../../TrincaMania Redesign/TrincaMania-ODS12",
);
const c8 = require.resolve("c8/bin/c8.js", { paths: [app] });
const typescript = require.resolve("typescript", { paths: [app] });

test("denominador inclui fonte TS não executada, source maps apontam TS e testes não inflam cobertura", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trinca-coverage-proof-"));
  try {
    fs.mkdirSync(path.join(dir, "src"));
    fs.mkdirSync(path.join(dir, "tests"));
    fs.writeFileSync(
      path.join(dir, "src/covered.ts"),
      "export function covered(value: number): number {\n  return value + 1;\n}\ncovered(1);\n",
    );
    const runner = `const fs = require('node:fs');
const ts = require(${JSON.stringify(typescript)});
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, inlineSourceMap: true, inlineSources: true },
  }).outputText;
  module._compile(code, filename);
};
require('../src/covered.ts');
`;
    const run = (extraTestCode = "") => {
      fs.writeFileSync(path.join(dir, "tests/run.cjs"), runner + extraTestCode);
      execFileSync(
        process.execPath,
        [
          c8,
          "--all",
          "--src=src",
          "--include=src/**/*.ts",
          "--reporter=json-summary",
          "--reporter=json",
          "--reports-dir=coverage",
          process.execPath,
          "tests/run.cjs",
        ],
        { cwd: dir, stdio: "pipe" },
      );
      return JSON.parse(
        fs.readFileSync(
          path.join(dir, "coverage/coverage-summary.json"),
          "utf8",
        ),
      );
    };
    const first = run();
    const testOnly = run(
      "\n" +
        Array.from(
          { length: 300 },
          (_, i) => `const testValue${i} = ${i};`,
        ).join("\n"),
    );
    assert.deepEqual(
      testOnly.total,
      first.total,
      "executar mais linhas de teste não aumenta a métrica",
    );
    fs.writeFileSync(
      path.join(dir, "src/never.ts"),
      "export function never(): number {\n  return 99;\n}\n",
    );
    const withUntested = run();
    const untested = withUntested[path.join(dir, "src/never.ts")];
    assert.equal(untested.lines.covered, 0);
    assert.ok(
      withUntested.total.lines.total > first.total.lines.total,
      "fonte não exercitada entra no denominador",
    );
    assert.equal(withUntested.total.lines.covered, first.total.lines.covered);
    assert.ok(withUntested.total.lines.pct < first.total.lines.pct);
    const details = JSON.parse(
      fs.readFileSync(path.join(dir, "coverage/coverage-final.json"), "utf8"),
    );
    const covered = details[path.join(dir, "src/covered.ts")];
    assert.ok(covered, "source map remapeia para o arquivo TS");
    assert.ok(
      Object.values(covered.statementMap).every(
        (location) => location.end.line <= 4,
      ),
      "relatório usa linhas originais TS, não helpers CommonJS",
    );
    assert.ok(
      Object.keys(details).every((file) =>
        file.startsWith(path.join(dir, "src")),
      ),
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
