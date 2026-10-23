const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSignature } = require('../scripts/check-release-apk.cjs');
const fingerprint = 'a'.repeat(64);
const valid = `Signer #1 certificate DN: CN=Release\nSigner #1 certificate SHA-256 digest: ${fingerprint}`;
test('release rejects debug even if fingerprint matches', () =>
  assert.throws(
    () =>
      validateSignature(
        valid.replace('CN=Release', 'CN=Android Debug'),
        fingerprint,
      ),
    /Debug/,
  ));
test('release requires approved fingerprint', () => {
  assert.throws(() => validateSignature(valid), /RELEASE_CERT/);
  assert.throws(() => validateSignature(valid, 'b'.repeat(64)), /identidade/);
});
test('release accepts exactly approved signer', () =>
  assert.equal(validateSignature(valid, fingerprint), fingerprint));
test('release rejects missing and multiple signers', () => {
  assert.throws(() => validateSignature('', fingerprint));
  assert.throws(() =>
    validateSignature(valid + '\n' + valid.replaceAll('#1', '#2'), fingerprint),
  );
});
