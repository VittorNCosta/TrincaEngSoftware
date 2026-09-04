/**
 * Orçamento de peso e higiene da pasta `assets/` (CI-12).
 *
 * O app é um jogo de mahjong offline; o que decide o tamanho do APK é imagem.
 * Hoje `assets/` tem ~86 MB, e o custo disso não aparece em nenhum teste — só
 * na hora em que alguém baixa o jogo.
 *
 * Verifica três coisas:
 *
 * 1. **Orçamento por arquivo** — nada acima de `LIMITE_BYTES`. Hoje 42
 *    arquivos passam do limite, então vale o mesmo livro-razão da guarda
 *    ODS 12: falha em arquivo **novo** acima do limite, e falha quando uma
 *    entrada do livro-razão some ou encolhe abaixo do limite, para o saldo ter
 *    que ser atualizado e a dívida encolher de verdade.
 *
 * 2. **Órfão** — asset que nenhum arquivo de `src/` referencia. Peso puro.
 *
 * 3. **Extensão duplicada** — `.png.png`. Sempre erro de exportação, e o par
 *    sempre é um dos dois arquivos duplicado.
 *
 * Atualizar o saldo depois de otimizar ou apagar:
 *
 *     npm run valida:assets -- --atualizar
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const assetsDir = path.join(projectRoot, 'assets');
const baselinePath = path.join(__dirname, 'assets-baseline.json');

/** Teto por arquivo. O roadmap (bloco A) fixa 400 KB para PNG de mapa. */
const LIMITE_BYTES = 400 * 1024;

const walk = (dir, found = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, found);
    } else {
      found.push(full);
    }
  }

  return found;
};

const walkSource = (dir, found = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkSource(full, found);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      found.push(full);
    }
  }

  return found;
};

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

const collect = () => {
  const files = walk(assetsDir).map((full) => ({
    bytes: fs.statSync(full).size,
    relative: path.relative(projectRoot, full).split(path.sep).join('/'),
  }));

  // Referência por nome de arquivo. O código usa `require('../../assets/...')`
  // com caminho literal, então o basename aparece cru na fonte.
  const sources = [
    ...walkSource(path.join(projectRoot, 'src')),
    path.join(projectRoot, 'app.json'),
  ]
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  return files.map((file) => ({
    ...file,
    orfao: !sources.includes(path.basename(file.relative)),
  }));
};

const readBaseline = () =>
  fs.existsSync(baselinePath)
    ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
    : { acimaDoLimite: {}, orfaos: [] };

const main = () => {
  const files = collect();
  const acima = files.filter((file) => file.bytes > LIMITE_BYTES);
  const orfaos = files.filter((file) => file.orfao);
  // `map_shop.png.png`: a extensão aparece duas vezes seguidas. Sempre erro de
  // exportação, e o arquivo certo é o irmão sem a repetição.
  const duplicados = files.filter((file) =>
    /\.([a-z0-9]+)\.\1$/i.test(file.relative),
  );

  if (process.argv.includes('--atualizar')) {
    const acimaDoLimite = {};

    acima
      .slice()
      .sort((a, b) => a.relative.localeCompare(b.relative))
      .forEach((file) => {
        acimaDoLimite[file.relative] = file.bytes;
      });

    fs.writeFileSync(
      baselinePath,
      `${JSON.stringify(
        {
          _leia:
            `Saldo de assets acima de ${kb(LIMITE_BYTES)} e de órfãos conhecidos. ` +
            'Gerado por scripts/valida-assets.js --atualizar. Só pode encolher.',
          acimaDoLimite,
          orfaos: orfaos.map((file) => file.relative).sort(),
        },
        null,
        2,
      )}\n`,
    );

    console.log(
      `saldo atualizado: ${acima.length} acima do limite, ${orfaos.length} órfãos`,
    );
    return;
  }

  const baseline = readBaseline();
  const problemas = [];

  acima.forEach((file) => {
    if (baseline.acimaDoLimite[file.relative] === undefined) {
      problemas.push(
        `asset novo acima do limite: ${file.relative} (${kb(file.bytes)} > ${kb(LIMITE_BYTES)})`,
      );
    } else if (file.bytes > baseline.acimaDoLimite[file.relative]) {
      problemas.push(
        `asset conhecido engordou: ${file.relative} ` +
          `(${kb(baseline.acimaDoLimite[file.relative])} → ${kb(file.bytes)})`,
      );
    }
  });

  Object.keys(baseline.acimaDoLimite).forEach((relative) => {
    const atual = files.find((file) => file.relative === relative);

    if (!atual || atual.bytes <= LIMITE_BYTES) {
      problemas.push(
        `saldo desatualizado: ${relative} já não estoura o limite — ` +
          'rode `npm run valida:assets -- --atualizar`',
      );
    }
  });

  const orfaosConhecidos = new Set(baseline.orfaos);
  orfaos.forEach((file) => {
    if (!orfaosConhecidos.has(file.relative)) {
      problemas.push(
        `asset órfão novo: ${file.relative} (${kb(file.bytes)}) — nada em src/ referencia`,
      );
    }
  });

  duplicados.forEach((file) => {
    if (!orfaosConhecidos.has(file.relative)) {
      problemas.push(`extensão duplicada: ${file.relative}`);
    }
  });

  if (problemas.length) {
    console.error('\n✖ validação de assets:\n');
    problemas.forEach((problema) => console.error(`  ${problema}`));
    console.error('');
    process.exitCode = 1;
    return;
  }

  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  console.log(
    `✔ assets: ${files.length} arquivos, ${(total / 1024 / 1024).toFixed(1)} MB. ` +
      `Dívida conhecida: ${Object.keys(baseline.acimaDoLimite).length} acima de ` +
      `${kb(LIMITE_BYTES)}, ${baseline.orfaos.length} órfãos.`,
  );
};

main();
