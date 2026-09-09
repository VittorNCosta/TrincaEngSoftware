/**
 * Guarda automatizada da regra permanente do `CLAUDE.md` (CI-13).
 *
 * A regra diz que vocabulário de fantasia genérica e o tema de frutas do jogo
 * pré-redesign são **bug de conteúdo**. A regra existe desde sempre; o que
 * faltava era alguém cobrando.
 *
 * ## Por que é um livro-razão e não um `grep` que reprova
 *
 * Um grep puro reprovaria hoje mesmo: o arquivo `ambient_celestial.mp3` ainda
 * carrega o nome antigo no disco, e há comentários em `BoardTile.tsx` e
 * `Tray.tsx` que chamam a peça de `doce`/`jelly`/`candy`. Isso é dívida
 * conhecida, com tarefa marcada no roadmap (blocos S e L) — não é regressão.
 *
 * E existe o inverso: ocorrência legítima. "Restos de fruta" é literalmente o
 * que é resíduo orgânico, e há comentário que só existe para dizer que o tema
 * de frutas **não** vale mais. Reprovar isso ensinaria a ignorar a guarda.
 *
 * Então o script compara o estado atual com `scripts/ods12-baseline.json` e
 * reprova em dois casos:
 *
 * 1. **Ocorrência nova** — arquivo/termo que não está no livro-razão. É
 *    regressão: alguém reintroduziu o vocabulário.
 * 2. **Entrada morta** — está no livro-razão e não existe mais. O saldo tem
 *    que encolher de verdade; sem isso o arquivo vira decoração.
 *
 * Depois de limpar (ou de justificar) uma entrada:
 *
 *     npm run guarda:ods12 -- --atualizar
 *
 * A chave é `arquivo::termo`, não a linha: linha muda a cada edição acima e
 * transformaria a guarda numa fonte de falha aleatória.
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const baselinePath = path.join(__dirname, 'ods12-baseline.json');
const scanRoots = ['src'];
const scanExtensions = new Set(['.ts', '.tsx']);

/**
 * Vocabulário barrado.
 *
 * Duas decisões que valem comentário:
 *
 * - **Fronteira de palavra à esquerda, sempre.** Sem ela `anjo` casa dentro de
 *   "arranjo" e a guarda vira ruído — foi o primeiro falso positivo real.
 * - **Sem fronteira à direita nos termos em inglês.** Eles aparecem em
 *   identificador camelCase (`sweetCrystal`, `sweetEmojiOne` no
 *   `LevelSelectScreen`), e travar em `\bsweet\b` deixaria passar justamente a
 *   maior concentração de drift do arquivo.
 */
const FORBIDDEN = [
  ['reino', /\breinos?\b/gi],
  ['castelo', /\bcastel[oa]s?\b/gi],
  ['dragao', /\bdrag(ão|ao|ões|oes)\b/gi],
  ['cristal-magico', /\bcristal\s+m[áa]gic[oa]\b/gi],
  ['doce', /\bdoces?\b/gi],
  ['acucar', /\ba[çc][úu]car\w*/gi],
  ['pirata', /\bpiratas?\b/gi],
  ['tesouro', /\btesouros?\b/gi],
  ['anjo', /\banjos?\b/gi],
  ['celestial', /\bcelestial\w*/gi],
  ['sweet', /\bsweet\w*/gi],
  ['candy', /\bcandy\w*/gi],
  ['jelly', /\bjell(y|ies)\w*/gi],
  ['fruta', /\bfrutas?\b/gi],
  ['fruit', /\bfruit\w*/gi],
];

const walk = (dir, found = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, found);
    } else if (scanExtensions.has(path.extname(entry.name))) {
      found.push(full);
    }
  }

  return found;
};

/** Todo arquivo sob `assets/`, para varrer o **nome**, não o conteúdo. */
const listAssets = (dir, found = []) => {
  if (!fs.existsSync(dir)) {
    return found;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      listAssets(full, found);
    } else {
      found.push(full);
    }
  }

  return found;
};

/** `{ "arquivo::termo": { count, linhas: [n] } }` */
const scan = () => {
  const hits = {};

  const record = (relative, term, matches, line) => {
    const key = `${relative}::${term}`;
    hits[key] ??= { count: 0, linhas: [] };
    hits[key].count += matches;
    hits[key].linhas.push(line);
  };

  for (const root of scanRoots) {
    for (const file of walk(path.join(projectRoot, root))) {
      const relative = path
        .relative(projectRoot, file)
        .split(path.sep)
        .join('/');
      const lines = fs.readFileSync(file, 'utf8').split('\n');

      lines.forEach((line, index) => {
        for (const [term, pattern] of FORBIDDEN) {
          pattern.lastIndex = 0;
          const matches = line.match(pattern);

          if (matches) {
            record(relative, term, matches.length, index + 1);
          }
        }
      });
    }
  }

  // Nome de asset também é conteúdo: `ambient_celestial.mp3` aparece no jogo
  // como a trilha do Mundo 8 e no repositório como um arquivo. Trocar só a
  // constante no código deixaria o nome antigo vivo no disco.
  for (const file of listAssets(path.join(projectRoot, 'assets'))) {
    const relative = path.relative(projectRoot, file).split(path.sep).join('/');

    // `_` é caractere de palavra, então `\b` não abre em `ambient_celestial`.
    // Nome de arquivo usa `_` como separador — vira `-` só para a comparação.
    const nameForMatching = path.basename(relative).replace(/_/g, '-');

    for (const [term, pattern] of FORBIDDEN) {
      pattern.lastIndex = 0;
      const matches = nameForMatching.match(pattern);

      if (matches) {
        record(relative, term, matches.length, 0);
      }
    }
  }

  return hits;
};

const readBaseline = () => {
  if (!fs.existsSync(baselinePath)) {
    return { entradas: {} };
  }

  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
};

const writeBaseline = (hits, previous) => {
  const entradas = {};

  for (const key of Object.keys(hits).sort()) {
    entradas[key] = {
      count: hits[key].count,
      linhas: hits[key].linhas,
      // Preserva a justificativa escrita à mão; entrada nova nasce sem ela.
      motivo:
        previous.entradas[key]?.motivo ?? 'SEM JUSTIFICATIVA — classifique',
      situacao: previous.entradas[key]?.situacao ?? 'pendente',
    };
  }

  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        _leia:
          'Livro-razão da guarda ODS 12. Gerado por scripts/guarda-ods12.js ' +
          '--atualizar. "situacao": "ok" = ocorrência legítima; "pendente" = ' +
          'dívida com tarefa no roadmap. A lista só pode encolher.',
        entradas,
      },
      null,
      2,
    )}\n`,
  );
};

const main = () => {
  const hits = scan();
  const baseline = readBaseline();

  if (process.argv.includes('--atualizar')) {
    writeBaseline(hits, baseline);
    const pendentes = Object.values(baseline.entradas).filter(
      (entry) => entry.situacao === 'pendente',
    ).length;
    console.log(
      `livro-razão atualizado: ${Object.keys(hits).length} entradas ` +
        `(${pendentes} pendentes na versão anterior)`,
    );
    return;
  }

  const novas = Object.keys(hits).filter((key) => !baseline.entradas[key]);
  const mortas = Object.keys(baseline.entradas).filter((key) => !hits[key]);

  if (novas.length) {
    console.error('\n✖ vocabulário barrado reintroduzido:\n');
    novas.forEach((key) => {
      const [file, term] = key.split('::');
      console.error(
        `  ${file}  ("${term}", linhas ${hits[key].linhas.join(', ')})`,
      );
    });
    console.error(
      '\n  A regra permanente do CLAUDE.md trata isso como bug de conteúdo.',
    );
    console.error('  Se a ocorrência for legítima, registre no livro-razão:');
    console.error('    npm run guarda:ods12 -- --atualizar');
    console.error('  e escreva o "motivo" da entrada nova.\n');
  }

  if (mortas.length) {
    console.error('\n✖ entradas do livro-razão que não existem mais:\n');
    mortas.forEach((key) => console.error(`  ${key}`));
    console.error(
      '\n  Provavelmente a dívida foi paga — ótimo. Rode' +
        ' `npm run guarda:ods12 -- --atualizar` para o saldo refletir isso.\n',
    );
  }

  if (novas.length || mortas.length) {
    process.exitCode = 1;
    return;
  }

  const pendentes = Object.entries(baseline.entradas).filter(
    ([, entry]) => entry.situacao === 'pendente',
  );

  console.log(
    `✔ guarda ODS 12: nenhuma regressão. ${pendentes.length} pendência(s) conhecida(s).`,
  );
  pendentes.forEach(([key, entry]) =>
    console.log(`  · ${key} — ${entry.motivo}`),
  );
};

main();
