const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { collect } = require('../scripts/valida-assets.js');

test('guarda reconhece App.tsx e densidades nativas, mantendo órfãos reais visíveis', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ods-assets-'));
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.mkdirSync(path.join(root, 'assets'));
    fs.writeFileSync(
      path.join(root, 'App.tsx'),
      "require('./assets/icon.png')",
    );
    for (const name of [
      'icon.png',
      'icon@2x.png',
      'icon@3x.png',
      'unused.png',
      'unused@2x.png',
    ])
      fs.writeFileSync(path.join(root, 'assets', name), 'fixture');
    const files = collect(root);
    assert.deepEqual(
      files
        .filter((file) => file.orfao)
        .map((file) => path.basename(file.relative))
        .sort(),
      ['unused.png', 'unused@2x.png'],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
