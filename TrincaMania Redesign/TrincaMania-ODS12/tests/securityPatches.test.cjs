const { test } = require('node:test');
const assert = require('node:assert/strict');
const braces = require('braces');
const forge = require('node-forge');
const { generateKeyPairSync } = require('node:crypto');
const {
  applySecurityPatches,
  verifySecurityPatches,
} = require('../scripts/apply-security-patches.cjs');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const patches = require('../scripts/security-patches.json');

test('patches são idempotentes e padrões normais continuam funcionando', () => {
  verifySecurityPatches();
  assert.deepEqual(braces.expand('src/{components,screens}/*.{ts,tsx}'), [
    'src/components/*.ts',
    'src/components/*.tsx',
    'src/screens/*.ts',
    'src/screens/*.tsx',
  ]);
  assert.equal(braces.compile('a/{b,c}/d'), 'a/(b|c)/d');
});

test('instalação aplica os patches e recusa deriva de versão ou conteúdo sem ocultar a falha', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ods-patches-'));
  try {
    for (const [name, version] of Object.entries(patches.versions)) {
      const dir = path.join(root, 'node_modules', name);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ version }),
      );
    }
    for (const change of patches.changes) {
      const target = path.join(root, 'node_modules', change.file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const patched = fs.readFileSync(require.resolve(change.file), 'utf8');
      fs.writeFileSync(target, patched.split(change.after).join(change.before));
    }
    assert.throws(() => verifySecurityPatches(root), /ausente/);
    applySecurityPatches(root);
    applySecurityPatches(root);
    verifySecurityPatches(root);
    const target = path.join(root, 'node_modules', patches.changes[0].file);
    fs.appendFileSync(target, '// unexpected');
    assert.throws(() => verifySecurityPatches(root), /divergente/);
    assert.throws(() => applySecurityPatches(root), /hash inesperado/);
    fs.writeFileSync(
      path.join(root, 'node_modules/braces/package.json'),
      '{"version":"9.0.0"}',
    );
    assert.throws(() => applySecurityPatches(root), /Reavalie/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('padrões profundamente aninhados e ASTs cíclicas são recusados sem estouro de pilha', () => {
  for (const [open, close] of [
    ['{', '}'],
    ['(', ')'],
  ]) {
    const pattern = open.repeat(4000) + 'a,b' + close.repeat(4000);
    for (const method of ['parse', 'compile', 'expand', 'stringify'])
      assert.throws(() => braces[method](pattern), /security depth/);
  }
  let ast = { type: 'text', value: 'x' };
  for (let i = 0; i < 10000; i++) ast = { type: 'root', nodes: [ast] };
  for (const method of ['compile', 'expand', 'stringify'])
    assert.throws(() => braces[method](ast), /security depth/);
  const cycle = { type: 'root', nodes: [] };
  cycle.nodes.push(cycle);
  assert.throws(() => braces.compile(cycle), /cycle/);
});

test('RSA aceita SHA256 válido e rejeita elementos extras dentro de DigestAlgorithm', () => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicExponent: 3,
  });
  const privateKey = forge.pki.privateKeyFromPem(
    pair.privateKey.export({ type: 'pkcs1', format: 'pem' }),
  );
  const publicKey = forge.pki.publicKeyFromPem(
    pair.publicKey.export({ type: 'pkcs1', format: 'pem' }),
  );
  const md = forge.md.sha256.create().update('ODS 12');
  const digest = md.digest().getBytes();
  assert.equal(publicKey.verify(digest, privateKey.sign(md)), true);
  const { asn1 } = forge;
  const der = (extra, parameters = true) =>
    asn1
      .toDer(
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(forge.oids.sha256).getBytes(),
            ),
            ...(parameters
              ? [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')]
              : []),
            ...extra,
          ]),
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OCTETSTRING,
            false,
            digest,
          ),
        ]),
      )
      .getBytes();
  assert.equal(
    publicKey.verify(digest, privateKey.sign(der([], false), 'NONE')),
    true,
  );
  for (const extra of [
    [asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '')],
    [
      asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OCTETSTRING,
        false,
        'garbage',
      ),
    ],
  ])
    assert.throws(
      () => publicKey.verify(digest, privateKey.sign(der(extra), 'NONE')),
      /DigestInfo/,
    );
});
