// Temporary, fail-closed mitigations until upstream publishes patched releases.
// npm audit still reports the original versions; never suppress those advisories.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const patches = require('./security-patches.json');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const guard = `'use strict';
module.exports = function guard(root) {
  const pending = [[root, 0]];
  const seen = new WeakSet();
  let count = 0;
  while (pending.length) {
    const [node, depth] = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if (depth >= 128 || seen.has(node) || ++count > 200000) {
      throw new SyntaxError('Brace AST exceeds security depth/size limit or contains a cycle');
    }
    seen.add(node);
    if (Array.isArray(node.nodes)) {
      for (const child of node.nodes) pending.push([child, depth + 1]);
    }
  }
};
`;

function applySecurityPatches(root = path.resolve(__dirname, '..')) {
  const modules = path.join(root, 'node_modules');
  for (const [name, version] of Object.entries(patches.versions)) {
    const installed = JSON.parse(
      fs.readFileSync(path.join(modules, name, 'package.json'), 'utf8'),
    );
    if (installed.version !== version)
      throw new Error(
        `Reavalie o patch de segurança: ${name}@${installed.version}`,
      );
  }
  // Validate every input before modifying anything, including repeated installs.
  const pending = patches.changes.map((change) => {
    const file = path.join(modules, change.file);
    const original = fs.readFileSync(file, 'utf8');
    const hash = digest(original);
    if (![change.beforeSha256, change.afterSha256].includes(hash))
      throw new Error(`Patch recusado: hash inesperado em ${change.file}`);
    const content =
      hash === change.afterSha256
        ? original
        : original.split(change.before).join(change.after);
    if (digest(content) !== change.afterSha256)
      throw new Error(`Patch inválido: ${change.file}`);
    return { file, content };
  });
  const guardPath = path.join(modules, 'braces/lib/audit-depth-guard.js');
  if (fs.existsSync(guardPath) && fs.readFileSync(guardPath, 'utf8') !== guard)
    throw new Error('Patch recusado: guarda de profundidade divergente');
  fs.writeFileSync(guardPath, guard);
  for (const { file, content } of pending) fs.writeFileSync(file, content);
  console.log(
    'Mitigações locais aplicadas: braces (profundidade) e node-forge (DigestAlgorithm).',
  );
}

function verifySecurityPatches(root = path.resolve(__dirname, '..')) {
  const modules = path.join(root, 'node_modules');
  for (const [name, version] of Object.entries(patches.versions)) {
    const installed = JSON.parse(
      fs.readFileSync(path.join(modules, name, 'package.json'), 'utf8'),
    );
    if (installed.version !== version)
      throw new Error(
        `Reavalie o patch de segurança: ${name}@${installed.version}`,
      );
  }
  for (const change of patches.changes) {
    if (
      digest(fs.readFileSync(path.join(modules, change.file))) !==
      change.afterSha256
    )
      throw new Error(
        `Mitigação de segurança ausente ou divergente: ${change.file}`,
      );
  }
  if (
    fs.readFileSync(
      path.join(modules, 'braces/lib/audit-depth-guard.js'),
      'utf8',
    ) !== guard
  )
    throw new Error('Guarda de profundidade ausente ou divergente');
}

if (require.main === module) applySecurityPatches();
module.exports = { applySecurityPatches, verifySecurityPatches };
