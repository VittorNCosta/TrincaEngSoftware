/**
 * Config dinâmica do Expo.
 *
 * O `app.json` continua sendo a fonte da configuração estática; o Expo passa o
 * conteúdo dele em `config` e o que sai daqui é o que vale. A única coisa que
 * esta camada faz é **derivar a versão do `package.json`**, para que exista um
 * lugar só onde a versão é escrita.
 *
 * Por que importa: o `release-please` versiona lendo o histórico de commits e
 * escreve o número no `package.json`. Se o `app.json` guardasse a versão
 * separadamente, todo release publicaria um APK com a versão anterior — e
 * ninguém perceberia, porque nada quebra.
 *
 * O `versionCode` (Android) e o `buildNumber` (iOS) **não** saem daqui: o
 * `eas.json` usa `appVersionSource: "remote"` com `autoIncrement`, então o
 * próprio EAS os controla. Definir a mão aqui reintroduziria o conflito.
 */
const { version } = require('./package.json');

module.exports = ({ config }) => ({
  ...config,
  version,
});
