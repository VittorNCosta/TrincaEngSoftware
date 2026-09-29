const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');
const { verify, SCREENS } = require('../scripts/verificar-regressao-visual');
const { compare } = require('../scripts/comparar-visual');

test('capturas Android exigidas passam somente com baseline válida e mudança visível reprova', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trinca-visual-runner-'));
  const baseline = path.join(root, 'baseline');
  const captures = path.join(root, 'captures');
  const output = path.join(root, 'diffs');
  fs.mkdirSync(baseline);
  const white = new PNG({ width: 320, height: 640 });
  white.data.fill(255);
  const config = {
    profile: 'android-api34-320x640-font1',
    width: 320,
    height: 640,
    screens: Object.fromEntries(
      Object.keys(SCREENS).map((name) => [
        name,
        { channelDelta: 0, maxChangedRatio: 0 },
      ]),
    ),
  };
  fs.writeFileSync(path.join(baseline, 'config.json'), JSON.stringify(config));
  for (const name of ['mapa', 'partida'])
    fs.writeFileSync(path.join(baseline, `${name}.png`), PNG.sync.write(white));
  const screenshot = (name, image = white) => {
    const dir = path.join(captures, name, 'takeScreenshot', 'artifacts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.png`), PNG.sync.write(image));
  };
  try {
    assert.throws(
      () => verify('smoke', captures, baseline, output),
      /Capturas de mapa/,
    );
    screenshot('mapa');
    screenshot('partida');
    verify('smoke', captures, baseline, output);
    assert.throws(
      () => verify('calibration', captures, baseline, output),
      /Capturas de mapa: esperadas 15/,
    );
    const changed = PNG.sync.read(PNG.sync.write(white));
    changed.data[0] = 0;
    screenshot('mapa', changed);
    assert.throws(
      () => verify('smoke', captures, baseline, output),
      /Regressão visual/,
    );
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(output, 'mapa-1/report.json')))
        .passed,
      false,
    );
    fs.rmSync(path.join(baseline, 'mapa.png'));
    assert.throws(() => verify('smoke', captures, baseline, output), /ENOENT/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('máscara ignora apenas relógio do sistema e preserva regressão na tela', () => {
  const baseline = new PNG({ width: 2, height: 2 });
  baseline.data.fill(255);
  const actual = PNG.sync.read(PNG.sync.write(baseline));
  actual.data[0] = 0;
  const settings = {
    channelDelta: 0,
    maxChangedRatio: 0,
    ignoreRects: [[0, 0, 2, 1]],
  };
  assert.equal(compare(baseline, actual, settings).report.passed, true);
  actual.data[8] = 0;
  const result = compare(baseline, actual, settings);
  assert.equal(result.report.passed, false);
  assert.equal(result.report.comparedPixels, 2);
  assert.equal(result.report.changedRatio, 0.5);
  assert.throws(
    () =>
      compare(baseline, actual, { ...settings, ignoreRects: [[0, 0, 3, 1]] }),
    /Máscara/,
  );
});
