// Read-only gate: never builds, installs, signs or uploads an APK.
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const config = require('../app.json').expo;
const { version } = require('../package.json');
function validateManifest(output) {
  const packageName = /^package: name='([^']+)'/m.exec(output)?.[1];
  const versionName = /^package:.*versionName='([^']+)'/m.exec(output)?.[1];
  if (packageName !== config.android.package || versionName !== version)
    throw new Error(
      'Pacote ou versão do APK não corresponde ao aplicativo revisado.',
    );
  if (/^application-debuggable\s*$/m.test(output))
    throw new Error('APK debuggable: distribuição de release bloqueada.');
  const permissions = [
    ...output.matchAll(/^uses-permission(?:-sdk-\d+)?: name='([^']+)'/gm),
  ].map((match) => match[1]);
  const forbidden = permissions.filter((permission) =>
    config.android.blockedPermissions.includes(permission),
  );
  if (forbidden.length)
    throw new Error(
      `Permissões bloqueadas presentes no APK: ${forbidden.join(', ')}`,
    );
  const minSdk = Number(/^sdkVersion:'(\d+)'/m.exec(output)?.[1]);
  const targetSdk = Number(/^targetSdkVersion:'(\d+)'/m.exec(output)?.[1]);
  if (minSdk !== 24 || targetSdk < 36)
    throw new Error(
      'SDK efetivo divergente: esperado minSdk 24 e targetSdk >= 36.',
    );
  return { packageName, versionName, minSdk, targetSdk, permissions };
}
function validateSignature(output, expected) {
  if (/Signer #\d+ certificate DN:.*\bAndroid Debug\b/i.test(output))
    throw new Error(
      'APK assinado com Android Debug: distribuição de release bloqueada.',
    );
  const fingerprints = [
    ...output.matchAll(
      /Signer #\d+ certificate SHA-256 digest:\s*([a-f0-9]{64})/gi,
    ),
  ].map((match) => match[1].toLowerCase());
  if (!/^[a-f0-9]{64}$/i.test(expected || ''))
    throw new Error(
      'Defina RELEASE_CERT_SHA256 com o fingerprint aprovado da chave de release (64 hex).',
    );
  if (fingerprints.length !== 1 || fingerprints[0] !== expected.toLowerCase())
    throw new Error(
      'Certificado não corresponde à identidade de release aprovada.',
    );
  return fingerprints[0];
}
// The local college demo keeps the installed identity. This is an explicit
// alternative to the release gate, which continues to reject Android Debug.
function validateAcademicSignature(output, expected) {
  if (!/^[a-f0-9]{64}$/i.test(expected || ''))
    throw new Error(
      'Defina ACADEMIC_CERT_SHA256 com o certificado do APK anterior.',
    );
  const fingerprints = [
    ...output.matchAll(
      /Signer #\d+ certificate SHA-256 digest:\s*([a-f0-9]{64})/gi,
    ),
  ].map((match) => match[1].toLowerCase());
  if (fingerprints.length !== 1 || fingerprints[0] !== expected.toLowerCase())
    throw new Error(
      'Certificado acadêmico diferente do APK anterior; atualização bloqueada.',
    );
  return fingerprints[0];
}
if (require.main === module) {
  try {
    const file = process.argv[2];
    if (!file || !existsSync(file))
      throw new Error('Uso: npm run release:check:apk -- /caminho/app.apk');
    const output = execFileSync(
      process.env.APKSIGNER || 'apksigner',
      ['verify', '--verbose', '--print-certs', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const academic = process.argv.slice(3).includes('--academic-local');
    if (academic)
      validateAcademicSignature(output, process.env.ACADEMIC_CERT_SHA256);
    else validateSignature(output, process.env.RELEASE_CERT_SHA256);
    validateManifest(
      execFileSync(process.env.AAPT2 || 'aapt2', ['dump', 'badging', file], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    console.log(
      `APK validado (${academic ? 'acadêmico local; assinatura de desenvolvimento preservada' : 'release'}): certificado esperado, pacote, versão, SDKs, sem depuração e sem permissões bloqueadas. Testes Android e migração de save continuam necessários.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = {
  validateSignature,
  validateAcademicSignature,
  validateManifest,
};
