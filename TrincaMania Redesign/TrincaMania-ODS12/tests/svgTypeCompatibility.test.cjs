const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const { createHash } = require('node:crypto');
const patch = require('../scripts/svg-types-patch.json');
const { applySvgTypePatch } = require('../scripts/apply-svg-types-patch.cjs');
const digest = (value) => createHash('sha256').update(value).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-types-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dependency = path.join(root, 'node_modules', patch.package);
  const file = path.join(dependency, patch.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    path.join(dependency, 'package.json'),
    JSON.stringify({ version: patch.version }),
  );
  let before = fs.readFileSync(
    path.join(__dirname, '..', 'node_modules', patch.package, patch.file),
    'utf8',
  );
  for (const { before: old, after: updated } of [...patch.changes].reverse())
    before = before.replace(updated, old);
  assert.equal(digest(before), patch.beforeSha256);
  fs.writeFileSync(file, before);
  return { root, dependency, file, before };
}
test('SVG compatibility is repeatable and changes only types plus safe color diagnostics', (t) => {
  const f = fixture(t);
  applySvgTypePatch(f.root);
  const after = fs.readFileSync(f.file, 'utf8');
  assert.equal(digest(after), patch.afterSha256);
  applySvgTypePatch(f.root);
  assert.equal(fs.readFileSync(f.file, 'utf8'), after);
  const compile = (source) =>
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
      },
    }).outputText;
  assert.equal(
    compile(f.before).replace('${stopColor}', '${String(stopColor)}'),
    compile(after),
  );
});
test('unexpected SVG source or dependency version is rejected without modifying the file', (t) => {
  const f = fixture(t);
  fs.writeFileSync(f.file, f.before + '\n// unexpected change');
  const changed = fs.readFileSync(f.file, 'utf8');
  assert.throws(() => applySvgTypePatch(f.root), /fonte divergente/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), changed);
  fs.writeFileSync(
    path.join(f.dependency, 'package.json'),
    JSON.stringify({ version: '99.0.0' }),
  );
  assert.throws(() => applySvgTypePatch(f.root), /Reavalie/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), changed);
});
