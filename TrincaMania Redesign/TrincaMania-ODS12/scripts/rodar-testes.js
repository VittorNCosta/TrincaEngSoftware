/**
 * Roda a suíte de domínio (`tests/*.test.cjs`) em qualquer Node >= 20 e em
 * qualquer shell.
 *
 * O comando era `node --test tests`. Passar o diretório só funciona até o Node
 * 21: do 22 em diante o runner trata o argumento posicional como arquivo e
 * morre com `MODULE_NOT_FOUND: .../tests`. Como o `engines` declara
 * `>=20.19.0`, `npm test` estava quebrado em metade das versões suportadas —
 * apareceu ao pôr Node 22 na matrix do CI (CI-06).
 *
 * A saída óbvia, `node --test tests/*.test.cjs`, troca um problema por outro: o
 * glob depende do shell expandir. Funciona no bash e no zsh, não funciona no
 * cmd nem no PowerShell, que é por onde o npm roda script no Windows.
 *
 * Então quem lista os arquivos é o Node: sem glob de shell, sem varredura
 * implícita do runner, mesma lista nas duas pontas.
 *
 * `simulateFullPlaythrough.cjs` fica de fora de propósito — não casa com
 * `.test.cjs` e tem script próprio (`npm run test:playthrough`), porque leva
 * ~1 min e não faz sentido pendurar isso em toda rodada.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const testsDir = path.join(__dirname, '..', 'tests');

const arquivos = fs
  .readdirSync(testsDir)
  .filter((nome) => nome.endsWith('.test.cjs'))
  .sort()
  .map((nome) => path.join(testsDir, nome));

// `scripts/cobertura.js` reaproveita a lista para rodar a mesma suite com
// `--experimental-test-coverage`. As duas medem o mesmo conjunto por
// construcao, e nao porque alguem lembrou de repetir o filtro.
module.exports = { arquivos, testsDir };

if (require.main === module) {
  if (arquivos.length === 0) {
    console.error(`nenhum *.test.cjs em ${testsDir}`);
    process.exit(1);
  }

  // Argumento extra passa adiante: `npm test -- --test-name-pattern=trinca`.
  const { status } = spawnSync(
    process.execPath,
    ['--test', ...process.argv.slice(2), ...arquivos],
    { stdio: 'inherit' },
  );

  process.exit(status ?? 1);
}
