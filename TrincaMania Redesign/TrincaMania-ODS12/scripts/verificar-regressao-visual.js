#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PNG } = require('pngjs');
const { compare } = require('./comparar-visual');

const SCREENS = {
  mapa: { smoke: 1, full: 3, calibration: 15 },
  partida: { smoke: 1, full: 3, calibration: 15 },
  vitoria: { smoke: 0, full: 1, calibration: 5 },
  'progresso-reaberto': { smoke: 0, full: 1, calibration: 5 },
  compra: { smoke: 0, full: 1, calibration: 5 },
  recompensas: { smoke: 0, full: 1, calibration: 5 },
  configuracoes: { smoke: 0, full: 1, calibration: 5 },
  poderes: { smoke: 0, full: 1, calibration: 5 },
  perfil: { smoke: 0, full: 1, calibration: 5 },
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function capturesIn(dir) {
  return walk(dir)
    .filter((file) =>
      file.replaceAll(path.sep, '/').includes('/takeScreenshot/artifacts/'),
    )
    .filter((file) => file.endsWith('.png'))
    .sort();
}

function verify(suite, captureDir, baselineDir, outputDir) {
  if (!['smoke', 'full', 'calibration'].includes(suite))
    throw new Error('Suíte deve ser smoke, full ou calibration.');
  const config = JSON.parse(
    fs.readFileSync(path.join(baselineDir, 'config.json'), 'utf8'),
  );
  if (config.profile !== 'android-api34-320x640-font1')
    throw new Error('Perfil de baseline desconhecido.');
  if (config.width !== 320 || config.height !== 640)
    throw new Error('Dimensões esperadas do perfil devem ser 320x640.');
  const captures = capturesIn(captureDir);
  const byScreen = new Map();
  for (const file of captures) {
    const name = path.basename(file, '.png');
    if (!(name in SCREENS)) throw new Error(`Captura sem baseline: ${name}`);
    byScreen.set(name, [...(byScreen.get(name) || []), file]);
  }
  for (const [name, expected] of Object.entries(SCREENS)) {
    const found = byScreen.get(name)?.length || 0;
    if (found !== expected[suite])
      throw new Error(
        `Capturas de ${name}: esperadas ${expected[suite]}, recebidas ${found}.`,
      );
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const failures = [];
  const hash = (bytes) =>
    crypto.createHash('sha256').update(bytes).digest('hex');
  for (const [name, files] of byScreen) {
    const settings = config.screens?.[name];
    if (!settings) throw new Error(`Tolerância ausente para ${name}.`);
    const baselinePath = path.join(baselineDir, `${name}.png`);
    const baselineBytes = fs.readFileSync(baselinePath);
    const baseline = PNG.sync.read(baselineBytes);
    if (baseline.width !== config.width || baseline.height !== config.height)
      throw new Error(`Baseline ${name} fora do perfil 320x640.`);
    for (const [index, file] of files.entries()) {
      const actualBytes = fs.readFileSync(file);
      const actual = PNG.sync.read(actualBytes);
      const { diff, report } = compare(baseline, actual, settings);
      const nameWithIndex = `${name}-${index + 1}`;
      const dir = path.join(outputDir, nameWithIndex);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'diff.png'), PNG.sync.write(diff));
      fs.writeFileSync(
        path.join(dir, 'report.json'),
        JSON.stringify(
          {
            ...report,
            capture: path.relative(captureDir, file),
            baselineSha256: hash(baselineBytes),
            actualSha256: hash(actualBytes),
          },
          null,
          2,
        ) + '\n',
      );
      console.log(
        `${nameWithIndex}: ${report.changedPixels}/${report.pixels} pixels; limite ${(settings.maxChangedRatio * 100).toFixed(3)}% — ${report.passed ? 'OK' : 'REGRESSÃO'}`,
      );
      if (!report.passed) failures.push(nameWithIndex);
    }
  }
  if (failures.length)
    throw new Error(`Regressão visual: ${failures.join(', ')}.`);
}

function main(args = process.argv.slice(2)) {
  if (args.length !== 4)
    throw new Error(
      'Uso: node scripts/verificar-regressao-visual.js smoke|full|calibration capturas baseline diffs',
    );
  verify(
    ...args.map((value, index) => (index === 0 ? value : path.resolve(value))),
  );
}

module.exports = { verify, capturesIn, SCREENS };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
