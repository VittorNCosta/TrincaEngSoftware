/**
 * Trava a configuração publicável do app.
 *
 * Nada aqui é regra de jogo — é o contrato do que vai para a loja. Cada
 * asserção existe porque o erro correspondente é silencioso: um APK sai com a
 * versão errada, uma permissão nova entra junto com uma lib, um segredo vaza
 * num arquivo versionado. Nenhum desses quebra o app em desenvolvimento.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..');
const appJson = require(path.join(projectRoot, 'app.json'));
const packageJson = require(path.join(projectRoot, 'package.json'));
const appConfig = require(path.join(projectRoot, 'app.config.js'));

/** Resolve a config como o Expo resolve: `app.json` entra, a função decide. */
const resolveConfig = () => appConfig({ config: appJson.expo });

test('a versão do app é derivada do package.json', () => {
  assert.equal(resolveConfig().version, packageJson.version);
});

test('app.json não guarda uma versão própria que possa divergir', () => {
  // Se alguém reintroduzir `version` aqui, o `app.config.js` ainda sobrescreve
  // — e o valor morto no JSON vira uma segunda fonte de verdade aparente.
  assert.equal(appJson.expo.version, undefined);
});

test('a identidade publicada é a do jogo atual, não a do jogo pré-redesign', () => {
  const config = resolveConfig();

  assert.equal(config.name, 'TrincaMania');
  assert.equal(config.slug, 'trinca-mania');
  assert.equal(config.android.package, 'br.com.mhvtech.trincamania');
});

test('o app não pede nenhuma permissão Android', () => {
  // O jogo é offline e só usa AsyncStorage local. Permissão nova aqui é sinal
  // de que uma dependência trouxe algo junto — decisão, nunca acidente.
  assert.deepEqual(resolveConfig().android.permissions, []);
});

test('o plugin expo-audio continua sem captura de áudio', () => {
  const plugins = resolveConfig().plugins ?? [];
  const audio = plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-audio',
  );

  assert.ok(audio, 'expo-audio precisa estar declarado com opções explícitas');
  assert.equal(audio[1].microphonePermission, false);
  assert.equal(audio[1].recordAudioAndroid, false);
});

test('nenhum arquivo de configuração versionado carrega segredo', () => {
  const easJson = require(path.join(projectRoot, 'eas.json'));
  const serialized = JSON.stringify({ app: appJson, eas: easJson });

  // O `projectId` do EAS é público por design e não entra nesta lista.
  const forbidden = [
    /"[A-Za-z0-9_-]*(secret|token|password|senha|apiKey|api_key)[A-Za-z0-9_-]*"\s*:\s*"[^"]+"/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    // Chave de API do Google: `AIza` seguido de 35 caracteres.
    /AIza[0-9A-Za-z_-]{35}/,
  ];

  forbidden.forEach((pattern) => {
    assert.equal(
      pattern.test(serialized),
      false,
      `app.json/eas.json casaram com ${pattern}`,
    );
  });
});

test('o EAS controla versionCode e buildNumber, não o repositório', () => {
  const easJson = require(path.join(projectRoot, 'eas.json'));
  const config = resolveConfig();

  assert.equal(easJson.cli.appVersionSource, 'remote');
  assert.equal(easJson.build.production.autoIncrement, true);
  // Com `appVersionSource: "remote"` o EAS recusa o build se estes existirem.
  assert.equal(config.android?.versionCode, undefined);
  assert.equal(config.ios?.buildNumber, undefined);
});
