// Read-only gate: never builds, installs, signs or uploads an APK.
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
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
    validateSignature(output, process.env.RELEASE_CERT_SHA256);
    console.log(
      'Assinatura APK válida e certificado de release aprovado. Confirme separadamente versão, permissões e testes Android antes de publicar.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { validateSignature };
