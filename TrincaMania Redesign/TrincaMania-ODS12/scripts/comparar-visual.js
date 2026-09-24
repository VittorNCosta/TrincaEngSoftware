#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PNG } = require('pngjs');

function compare(baseline, actual, { channelDelta, maxChangedRatio }) {
  if (
    !Number.isInteger(channelDelta) ||
    channelDelta < 0 ||
    channelDelta >= 255 ||
    !Number.isFinite(maxChangedRatio) ||
    maxChangedRatio < 0 ||
    maxChangedRatio >= 1
  )
    throw new Error(
      'Tolerância exige channelDelta inteiro 0..254 e maxChangedRatio em [0,1).',
    );
  if (
    !baseline.width ||
    !baseline.height ||
    baseline.width !== actual.width ||
    baseline.height !== actual.height
  )
    throw new Error(
      'Dimensões distintas ou vazias; não redimensionar screenshots.',
    );
  const pixels = baseline.width * baseline.height;
  if (baseline.data.length !== pixels * 4 || actual.data.length !== pixels * 4)
    throw new Error('Buffer RGBA incompleto.');
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  let changedPixels = 0;
  for (let offset = 0; offset < pixels * 4; offset += 4) {
    const changed = [0, 1, 2, 3].some(
      (channel) =>
        Math.abs(
          baseline.data[offset + channel] - actual.data[offset + channel],
        ) > channelDelta,
    );
    if (changed) changedPixels++;
    // Red highlights changes; unchanged pixels retain grayscale context.
    const gray = Math.round(
      (actual.data[offset] +
        actual.data[offset + 1] +
        actual.data[offset + 2]) /
        3,
    );
    diff.data.set(changed ? [255, 0, 0, 255] : [gray, gray, gray, 255], offset);
  }
  const changedRatio = changedPixels / pixels;
  return {
    diff,
    report: {
      width: baseline.width,
      height: baseline.height,
      pixels,
      changedPixels,
      changedRatio,
      channelDelta,
      maxChangedRatio,
      passed: changedRatio <= maxChangedRatio,
    },
  };
}

function main(args = process.argv.slice(2)) {
  if (args.length !== 5)
    throw new Error(
      'Uso: node scripts/comparar-visual.js baseline.png atual.png diretorio-diff delta-canal fracao-maxima',
    );
  const [baselinePath, actualPath, output, delta, ratio] = args;
  if (!delta.trim() || !ratio.trim())
    throw new Error('Tolerâncias explícitas obrigatórias.');
  // Read both inputs first: missing/corrupt baseline must never create a baseline.
  const baselineBytes = fs.readFileSync(baselinePath);
  const actualBytes = fs.readFileSync(actualPath);
  const inputs = [baselinePath, actualPath].map((file) =>
    fs.realpathSync(file),
  );
  fs.mkdirSync(output, { recursive: true });
  const outputDir = fs.realpathSync(output);
  const files = ['diff.png', 'report.json'].map((file) =>
    path.join(outputDir, file),
  );
  if (
    files.some((file) =>
      inputs.includes(fs.existsSync(file) ? fs.realpathSync(file) : file),
    )
  )
    throw new Error('Diretório de diff sobrescreveria uma imagem de entrada.');
  const { diff, report } = compare(
    PNG.sync.read(baselineBytes),
    PNG.sync.read(actualBytes),
    {
      channelDelta: Number(delta),
      maxChangedRatio: Number(ratio),
    },
  );
  const hash = (bytes) =>
    crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(files[0], PNG.sync.write(diff));
  fs.writeFileSync(
    files[1],
    JSON.stringify(
      {
        ...report,
        baselineSha256: hash(baselineBytes),
        actualSha256: hash(actualBytes),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `${report.changedPixels}/${report.pixels} pixels alterados; diff em ${output}`,
  );
  return report.passed ? 0 : 1;
}
module.exports = { compare, main };
if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Comparação não aprovada: ${error.message}`);
    process.exitCode = 2;
  }
}
