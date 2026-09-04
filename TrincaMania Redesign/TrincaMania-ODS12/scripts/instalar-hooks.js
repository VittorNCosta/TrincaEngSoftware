/**
 * Aponta o git para os hooks versionados em `.githooks/`.
 *
 * ## Por que não é o husky
 *
 * O husky exige que o `.git` esteja no diretório de onde ele roda. Aqui não
 * está: o repositório é `TrincaEngSoftware/` e o projeto vive dois níveis
 * abaixo, em `TrincaMania Redesign/TrincaMania-ODS12/`. Rodar `husky` daqui
 * falha, e rodar da raiz exigiria um `package.json` de raiz só para hospedar a
 * ferramenta. O que o husky faria de útil — um `git config core.hooksPath` — é
 * a única linha que importa, e ela cabe aqui com o cálculo de caminho correto.
 *
 * ## O que ele faz
 *
 * `core.hooksPath` é config **local**, não versionada: cada clone precisa
 * configurar de novo. Por isso este script roda no `prepare`, que o npm executa
 * depois de todo `npm install`.
 *
 * O caminho é relativo à raiz do repositório e contém espaço ("TrincaMania
 * Redesign"). O git aceita — o valor não passa por shell —, mas é a razão de o
 * caminho ser calculado e não escrito à mão.
 *
 * Falhar aqui nunca quebra a instalação: sem `.git` (CI com checkout raso,
 * tarball, container de build) o script apenas avisa e sai com 0.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const hooksDir = path.join(projectRoot, '.githooks');

const git = (args) =>
  execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim();

const main = () => {
  if (!fs.existsSync(hooksDir)) {
    console.log(`[hooks] ${hooksDir} não existe — nada a configurar.`);
    return;
  }

  let repoRoot;

  try {
    repoRoot = git(['rev-parse', '--show-toplevel']);
  } catch {
    console.log('[hooks] fora de um repositório git — pulando.');
    return;
  }

  // O git resolve `core.hooksPath` relativo à raiz do repositório, e o separador
  // precisa ser "/" mesmo no Windows.
  const relative = path.relative(repoRoot, hooksDir).split(path.sep).join('/');

  try {
    const current = git(['config', '--get', 'core.hooksPath']);

    if (current === relative) {
      return;
    }
  } catch {
    // `--get` sai com 1 quando a chave não existe. É o caso normal.
  }

  git(['config', 'core.hooksPath', relative]);
  console.log(`[hooks] core.hooksPath -> ${relative}`);
};

main();
