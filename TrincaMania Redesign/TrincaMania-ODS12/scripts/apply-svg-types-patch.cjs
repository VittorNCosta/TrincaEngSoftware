// Compatibility for pinned native SVG types; color warnings also accept symbols.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const patch = require('./svg-types-patch.json');
const digest = (value) => createHash('sha256').update(value).digest('hex');
function applySvgTypePatch(root = path.resolve(__dirname, '..')) {
  const dependency = path.join(root, 'node_modules', patch.package);
  const { version } = JSON.parse(
    fs.readFileSync(path.join(dependency, 'package.json'), 'utf8'),
  );
  if (version !== patch.version)
    throw new Error(`Reavalie a compatibilidade SVG: ${version}`);
  const file = path.join(dependency, patch.file);
  const original = fs.readFileSync(file, 'utf8');
  const hash = digest(original);
  if (hash === patch.afterSha256) return;
  if (hash !== patch.beforeSha256)
    throw new Error('Patch SVG recusado: fonte divergente');
  let updated = original;
  for (const { before, after } of patch.changes)
    updated = updated.replace(before, after);
  if (digest(updated) !== patch.afterSha256)
    throw new Error('Patch SVG inválido');
  fs.writeFileSync(file, updated);
}
if (require.main === module) {
  applySvgTypePatch();
  console.log(
    'Compatibilidade de tipos SVG aplicada; comportamento nativo preservado.',
  );
}
module.exports = { applySvgTypePatch };
