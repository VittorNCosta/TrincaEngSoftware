const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateSignature,
  validateAcademicSignature,
  validateManifest,
} = require('../scripts/check-release-apk.cjs');
const fingerprint = 'a'.repeat(64);
const valid = `Signer #1 certificate DN: CN=Release\nSigner #1 certificate SHA-256 digest: ${fingerprint}`;
const manifest = `package: name='br.com.mhvtech.trincamania' versionCode='2' versionName='${require('../package.json').version}'\nsdkVersion:'24'\ntargetSdkVersion:'36'\nuses-permission: name='android.permission.INTERNET'`;
test('APK exige identidade, SDKs, release e permissões efetivas adequadas', () => {
  assert.equal(validateManifest(manifest).targetSdk, 36);
  for (const invalid of [
    manifest.replace(
      'br.com.mhvtech.trincamania',
      'br.com.mhvtech.trincamania.e2e',
    ),
    manifest.replace("sdkVersion:'24'", "sdkVersion:'23'"),
    manifest.replace("targetSdkVersion:'36'", "targetSdkVersion:'35'"),
    manifest + '\napplication-debuggable',
    manifest.replace(/versionName='[^']+'/, "versionName='0.0.0'"),
    ...require('../app.json').expo.android.blockedPermissions.map(
      (permission) => manifest + `\nuses-permission: name='${permission}'`,
    ),
  ])
    assert.throws(() => validateManifest(invalid));
});
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
test('academic update preserves the previous signer without weakening release', () => {
  const debug = valid.replace('CN=Release', 'CN=Android Debug');
  assert.equal(validateAcademicSignature(debug, fingerprint), fingerprint);
  assert.throws(() => validateSignature(debug, fingerprint), /Debug/);
  assert.throws(() => validateAcademicSignature(debug), /ACADEMIC_CERT/);
  assert.throws(
    () => validateAcademicSignature(debug, 'b'.repeat(64)),
    /anterior/,
  );
  assert.throws(() => validateAcademicSignature('', fingerprint));
  assert.throws(() =>
    validateAcademicSignature(
      debug + '\n' + debug.replaceAll('#1', '#2'),
      fingerprint,
    ),
  );
});
