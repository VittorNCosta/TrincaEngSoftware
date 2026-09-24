const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const app = path.resolve(
  __dirname,
  "../../../TrincaMania Redesign/TrincaMania-ODS12",
);
const { PNG } = require(path.join(app, "node_modules/pngjs"));
const { compare } = require(path.join(app, "scripts/comparar-visual"));
const script = path.join(app, "scripts/comparar-visual.js");
function picture(width = 2, height = 2) {
  const image = new PNG({ width, height });
  image.data.fill(255);
  return image;
}
const strict = { channelDelta: 0, maxChangedRatio: 0 };
test("imagens idênticas passam; mudança deliberada gera pixel vermelho e reprova", () => {
  const baseline = picture();
  const actual = picture();
  assert.equal(compare(baseline, actual, strict).report.passed, true);
  actual.data[0] = 0;
  const result = compare(baseline, actual, strict);
  assert.equal(result.report.passed, false);
  assert.equal(result.report.changedPixels, 1);
  assert.equal(result.report.changedRatio, 0.25);
  assert.deepEqual([...result.diff.data.subarray(0, 4)], [255, 0, 0, 255]);
});
test("tolerância de canal e fração são explícitas e respeitam limites", () => {
  const actual = picture();
  actual.data[0] = 250;
  assert.equal(
    compare(picture(), actual, { ...strict, channelDelta: 5 }).report.passed,
    true,
  );
  assert.equal(
    compare(picture(), actual, { ...strict, maxChangedRatio: 0.25 }).report
      .passed,
    true,
  );
  assert.equal(
    compare(picture(), actual, { ...strict, maxChangedRatio: 0.24 }).report
      .passed,
    false,
  );
  assert.throws(
    () => compare(picture(), actual, { ...strict, channelDelta: NaN }),
    /Tolerância/,
  );
  assert.throws(
    () => compare(picture(), actual, { ...strict, maxChangedRatio: 1 }),
    /Tolerância/,
  );
  assert.throws(() => compare(picture(), picture(3, 2), strict), /Dimensões/);
});
test("CLI produz diff/relatório e falha com baseline ausente, PNG inválido ou tamanho diferente", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trinca-visual-"));
  try {
    const baseline = path.join(dir, "baseline.png");
    const actual = path.join(dir, "actual.png");
    const output = path.join(dir, "result");
    fs.writeFileSync(baseline, PNG.sync.write(picture()));
    const changed = picture();
    changed.data[0] = 0;
    fs.writeFileSync(actual, PNG.sync.write(changed));
    const run = (base = baseline, out = output) =>
      spawnSync(process.execPath, [script, base, actual, out, "0", "0"], {
        encoding: "utf8",
      });
    assert.equal(run().status, 1);
    assert.equal(
      PNG.sync.read(fs.readFileSync(path.join(output, "diff.png"))).width,
      2,
    );
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(output, "report.json"))).passed,
      false,
    );
    const original = fs.readFileSync(baseline);
    assert.equal(run(path.join(dir, "missing.png")).status, 2);
    assert.deepEqual(fs.readFileSync(baseline), original);
    fs.writeFileSync(actual, "invalid");
    assert.equal(run().status, 2);
    fs.writeFileSync(actual, PNG.sync.write(picture(3, 2)));
    assert.equal(run().status, 2);
    fs.writeFileSync(actual, original);
    assert.equal(run().status, 0);
    assert.equal(run(path.join(output, "diff.png"), output).status, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
