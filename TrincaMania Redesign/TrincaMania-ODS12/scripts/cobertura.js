/** Cobertura de produção: domínio/storage/dados/utilitários pelo c8,
 * UI pelo Jest. A antiga média (incluía testes) foi arquivada sem redução em
 * cobertura-legado-node20.json; ela não representa a mesma população. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { arquivos } = require('./rodar-testes');
const root = path.resolve(__dirname, '..');
const baselinePath = path.join(__dirname, 'cobertura-minima.json');
const metrics = ['lines', 'branches', 'functions', 'statements'];
function compare(summary, floor) {
  const failures = [];
  for (const [scope, totals] of Object.entries(summary)) {
    if (!floor[scope]) {
      failures.push(`Piso ${scope} ausente`);
      continue;
    }
    for (const metric of metrics)
      if (
        !Number.isFinite(floor[scope][metric]) ||
        !Number.isFinite(totals[metric]?.pct) ||
        totals[metric].pct < floor[scope][metric]
      )
        failures.push(
          `${scope}/${metric}: ${totals[metric].pct}% < ${floor[scope][metric]}%`,
        );
  }
  return failures;
}
function run(script, args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  });
  if (result.status !== 0)
    throw new Error(`Cobertura interrompida: suíte falhou (${result.status})`);
}
function main() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major !== 22) throw new Error('Cobertura de produção exige Node 22');
  run(require.resolve('c8/bin/c8.js'), [
    '--all',
    '--src=src',
    '--include=src/**/*.ts',
    '--exclude=src/**/*.d.ts',
    '--exclude=src/**/__tests__/**',
    '--reporter=text',
    '--reporter=json-summary',
    '--reporter=lcov',
    '--reports-dir=coverage/domain',
    process.execPath,
    '--require',
    path.join(__dirname, 'cobertura-loader.js'),
    '--test',
    ...arquivos,
  ]);
  run(require.resolve('jest/bin/jest'), [
    '--runInBand',
    '--coverage',
    '--coverageDirectory=coverage/ui',
    '--coverageReporters=text',
    '--coverageReporters=json-summary',
    '--coverageReporters=lcov',
  ]);
  const summary = {};
  for (const scope of ['domain', 'ui']) {
    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, `coverage/${scope}/coverage-summary.json`),
        'utf8',
      ),
    );
    const paths = Object.keys(report).filter((key) => key !== 'total');
    if (
      !paths.length ||
      paths.some((file) => /[/\\](?:tests|__tests__|scripts)[/\\]/.test(file))
    )
      throw new Error(`Relatório ${scope} inclui testes/scripts ou está vazio`);
    const expected = fs
      .readdirSync(path.join(root, 'src'), { recursive: true })
      .filter(
        (file) =>
          (scope === 'ui' ? /\.tsx$/.test(file) : /(?<!\.d)\.ts$/.test(file)) &&
          !file.split(path.sep).includes('__tests__'),
      )
      .map((file) => path.join(root, 'src', file));
    if (scope === 'ui') expected.push(path.join(root, 'App.tsx'));
    const missing = expected.filter((file) => !Object.hasOwn(report, file));
    if (missing.length)
      throw new Error(
        `Fontes ausentes no denominador ${scope}: ${missing.join(', ')}`,
      );
    summary[scope] = report.total;
  }
  const piso = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (
    piso.methodology !== 'production-source-maps-v1' ||
    piso.nodeMajor !== major
  )
    throw new Error('Piso incompatível com metodologia/runtime');
  const failures = compare(summary, piso);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\nCobertura de produção (Node ${major}, source maps):\n\n${JSON.stringify(summary, null, 2)}\n`,
    );
  if (process.argv.includes('--atualizar')) {
    if (failures.length && !process.argv.includes('--permitir-queda'))
      throw new Error(`Piso só pode subir:\n${failures.join('\n')}`);
    const next = { methodology: piso.methodology, nodeMajor: major };
    for (const [scope, totals] of Object.entries(summary))
      next[scope] = Object.fromEntries(
        metrics.map((metric) => [metric, totals[metric].pct]),
      );
    fs.writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n');
  } else if (failures.length) throw new Error(failures.join('\n'));
}
module.exports = { compare };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
