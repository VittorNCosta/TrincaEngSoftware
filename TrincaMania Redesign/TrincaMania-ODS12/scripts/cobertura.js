/**
 * Piso de cobertura da suíte de domínio (CI-09).
 *
 * ## Por que não é `jest --coverage`
 *
 * O roadmap pedia `jest --coverage`, mas o Jest aqui roda **4 smoke tests de
 * componente** (`src/components/__tests__`). As 128 asserções que cobrem regra
 * de jogo, storage e domínio são `node:test` em `tests/*.test.cjs`, que o Jest
 * não coleta — o próprio `jest.config.js` diz isso. Um threshold sobre o Jest
 * mediria 4 arquivos de UI e chamaria isso de cobertura do projeto.
 *
 * Então o piso é medido onde os testes estão, com a cobertura nativa do
 * `node:test`.
 *
 * ## Por que a checagem é nossa e não do Node
 *
 * O Node 22+ tem `--test-coverage-lines` e amigos. O Node 20 não tem nenhum
 * deles, e a matrix do CI roda as duas versões. Fazer a conta aqui é o que
 * mantém o mesmo veredito nas duas pontas.
 *
 * ## Piso que só sobe
 *
 * Mesmo idioma dos guardas ODS 12 e de assets: em vez de um número redondo
 * escolhido no chute, o piso é o que a suíte cobre hoje, gravado em
 * `scripts/cobertura-minima.json`. Cobertura que cai reprova. Depois de
 * escrever teste novo:
 *
 *     npm run cobertura -- --atualizar
 *
 * Baixar o piso exige `--atualizar --permitir-queda`, para que afrouxar a
 * régua seja um ato explícito e visível no diff, não efeito colateral.
 *
 * O relatório do Node inclui os próprios `tests/*.test.cjs` no total, o que
 * infla o número em alguns pontos — eles são quase 100% executados por
 * definição. Como piso relativo isso não atrapalha: código novo sem teste
 * derruba a média do mesmo jeito. Não trate o valor como cobertura absoluta do
 * `src/`.
 *
 * ## O piso vale para uma versão de Node só
 *
 * O mesmo código e os mesmos 128 testes medem 85,70% de linha no Node 20 e
 * 79,57% no Node 24 — seis pontos de diferença que não têm nada a ver com
 * teste, e sim com o que cada V8 instrumenta e com quais arquivos entram no
 * relatório. Por isso o piso guarda o `nodeMajor` em que foi medido e recusa
 * comparar entre versões: um número medido noutra régua não é um número menor,
 * é outro número. O job do CI fixa a mesma versão do `engines`.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { arquivos } = require('./rodar-testes.js');

const pisoPath = path.join(__dirname, 'cobertura-minima.json');
const NODE_MAJOR = Number(process.versions.node.split('.')[0]);
const METRICAS = [
  ['linhas', 'linha'],
  ['ramos', 'ramo'],
  ['funcoes', 'função'],
];

/**
 * O reporter muda de prefixo entre versões: `#` no Node 20, `ℹ` no 24. Casar
 * os dois evita que a guarda passe a ler nada e reprove por engano.
 */
const linhaTotal =
  /^[#ℹ]\s*all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/m;

/** Mesma tabela, linha a linha, para o resumo do CI saber quem puxa a media. */
const linhaArquivo =
  /^[#ℹ]\s*(\S+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/;

const porArquivo = (saida) =>
  saida
    .split('\n')
    .map((linha) => linhaArquivo.exec(linha))
    .filter(Boolean)
    .map(([, arquivo, linhas, ramos, funcoes]) => ({
      arquivo,
      linhas: Number(linhas),
      ramos: Number(ramos),
      funcoes: Number(funcoes),
    }))
    .filter(
      ({ arquivo }) =>
        arquivo !== 'file' &&
        arquivo !== 'all' &&
        !arquivo.startsWith('tests/'),
    );

/**
 * Publica o resultado no resumo do job (CI-10).
 *
 * O roadmap falava em publicar no PR. Isso exigiria `pull-requests: write`,
 * reabrindo exatamente o privilegio que CI-04 acabou de fechar para um
 * relatorio que ninguem le duas vezes. `GITHUB_STEP_SUMMARY` renderiza o mesmo
 * markdown na pagina do run, sem permissao nenhuma e sem escrever para fora.
 *
 * Fora do CI a variavel nao existe e a funcao nao faz nada.
 */
const publicarResumo = (atual, piso, arquivos_, ok) => {
  const destino = process.env.GITHUB_STEP_SUMMARY;

  if (!destino) {
    return;
  }

  const pct = (v) => `${v.toFixed(2)}%`;
  const seta = (chave) => {
    const delta = atual[chave] - piso[chave];
    if (Math.abs(delta) < 0.005) return 'no piso';
    return `${delta > 0 ? '+' : ''}${delta.toFixed(2)} ponto`;
  };

  const piores = arquivos_
    .slice()
    .sort((a, b) => a.linhas - b.linhas)
    .slice(0, 10);

  const linhas = [
    `## Cobertura — ${ok ? 'no piso ou acima' : 'abaixo do piso'}`,
    '',
    `Suite \`tests/*.test.cjs\`, Node ${NODE_MAJOR}.`,
    '',
    '| Métrica | Atual | Piso | |',
    '| --- | ---: | ---: | --- |',
    ...METRICAS.map(
      ([chave, rotulo]) =>
        `| ${rotulo} | ${pct(atual[chave])} | ${pct(piso[chave])} | ${seta(chave)} |`,
    ),
    '',
    '<details><summary>Os 10 arquivos de <code>src/</code> menos cobertos</summary>',
    '',
    '| Arquivo | Linha | Ramo | Função |',
    '| --- | ---: | ---: | ---: |',
    ...piores.map(
      (f) =>
        `| \`${f.arquivo}\` | ${pct(f.linhas)} | ${pct(f.ramos)} | ${pct(f.funcoes)} |`,
    ),
    '',
    '</details>',
    '',
  ];

  fs.appendFileSync(destino, `${linhas.join('\n')}\n`);
};

const medir = () => {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    ['--test', '--experimental-test-coverage', ...arquivos],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );

  process.stdout.write(stdout ?? '');
  process.stderr.write(stderr ?? '');

  if (status !== 0) {
    console.error(
      '\n✖ a suíte falhou; cobertura não vale nada com teste vermelho.\n',
    );
    process.exit(status ?? 1);
  }

  const encontrado = linhaTotal.exec(stdout ?? '');

  if (!encontrado) {
    console.error(
      '\n✖ não achei a linha "all files" no relatório de cobertura.\n' +
        '  O formato do reporter do Node mudou — ajuste a regex em scripts/cobertura.js.\n',
    );
    process.exit(1);
  }

  return {
    linhas: Number(encontrado[1]),
    ramos: Number(encontrado[2]),
    funcoes: Number(encontrado[3]),
    arquivos: porArquivo(stdout ?? ''),
  };
};

const lerPiso = () =>
  fs.existsSync(pisoPath)
    ? JSON.parse(fs.readFileSync(pisoPath, 'utf8'))
    : null;

const gravarPiso = (atual) => {
  fs.writeFileSync(
    pisoPath,
    `${JSON.stringify(
      {
        _leia:
          'Piso de cobertura da suite tests/*.test.cjs, gerado por ' +
          'scripts/cobertura.js --atualizar. So sobe: baixar exige ' +
          '--permitir-queda. Inclui os proprios arquivos de teste no total. ' +
          'So vale no nodeMajor em que foi medido — o V8 conta diferente entre ' +
          'versoes.',
        nodeMajor: NODE_MAJOR,
        // So as tres metricas globais: sao as unicas que a comparacao le.
        // O detalhe por arquivo do resumo sai de `atual`, medido na hora —
        // gravar aqui poria 200+ linhas de numero que ninguem checa no diff
        // de toda atualizacao de piso.
        ...Object.fromEntries(METRICAS.map(([chave]) => [chave, atual[chave]])),
      },
      null,
      2,
    )}\n`,
  );
};

const main = () => {
  const atualizar = process.argv.includes('--atualizar');
  const permitirQueda = process.argv.includes('--permitir-queda');
  const piso = lerPiso();
  const atual = medir();

  const formatar = (v) => `${v.toFixed(2)}%`;

  if (atualizar) {
    const quedas =
      piso && piso.nodeMajor === NODE_MAJOR
        ? METRICAS.filter(([chave]) => atual[chave] < piso[chave]).map(
            ([chave, rotulo]) =>
              `  ${rotulo}: ${formatar(piso[chave])} → ${formatar(atual[chave])}`,
          )
        : [];

    if (quedas.length && !permitirQueda) {
      console.error('\n✖ isso baixaria o piso:\n');
      quedas.forEach((linha) => console.error(linha));
      console.error(
        '\n  Se a queda for intencional (código bem coberto foi removido, por\n' +
          '  exemplo), repita com --permitir-queda para o diff mostrar a decisão.\n',
      );
      process.exitCode = 1;
      return;
    }

    gravarPiso(atual);
    console.log(
      `\npiso atualizado: linhas ${formatar(atual.linhas)}, ramos ` +
        `${formatar(atual.ramos)}, funções ${formatar(atual.funcoes)}`,
    );
    return;
  }

  if (!piso) {
    console.error(
      '\n✖ scripts/cobertura-minima.json não existe.\n' +
        '  Rode `npm run cobertura -- --atualizar` para gravar o piso inicial.\n',
    );
    process.exitCode = 1;
    return;
  }

  if (piso.nodeMajor !== NODE_MAJOR) {
    console.error(
      `\n✖ o piso foi medido no Node ${piso.nodeMajor} e você está no ` +
        `${NODE_MAJOR}.\n` +
        '  Os números do V8 não são comparáveis entre versões (chega a seis\n' +
        '  pontos), então comparar aqui só produziria um vermelho falso.\n' +
        `  Rode no Node ${piso.nodeMajor} — que é o que o CI e o \`engines\` usam —\n` +
        '  ou regrave o piso com `npm run cobertura -- --atualizar`.\n',
    );
    process.exitCode = 1;
    return;
  }

  const abaixo = METRICAS.filter(([chave]) => atual[chave] < piso[chave]);

  publicarResumo(atual, piso, atual.arquivos, abaixo.length === 0);

  if (abaixo.length) {
    console.error('\n✖ cobertura abaixo do piso:\n');
    abaixo.forEach(([chave, rotulo]) =>
      console.error(
        `  ${rotulo}: ${formatar(atual[chave])} < ${formatar(piso[chave])} ` +
          `(-${(piso[chave] - atual[chave]).toFixed(2)} ponto)`,
      ),
    );
    console.error(
      '\n  Código novo sem teste é a causa usual. Se a queda for legítima,\n' +
        '  `npm run cobertura -- --atualizar --permitir-queda`.\n',
    );
    process.exitCode = 1;
    return;
  }

  const subiu = METRICAS.filter(([chave]) => atual[chave] > piso[chave]);

  console.log(
    `\n✔ cobertura no piso ou acima: linhas ${formatar(atual.linhas)}, ramos ` +
      `${formatar(atual.ramos)}, funções ${formatar(atual.funcoes)}`,
  );

  if (subiu.length) {
    console.log(
      '  Subiu desde o último piso — vale rodar ' +
        '`npm run cobertura -- --atualizar` para travar o ganho:',
    );
    subiu.forEach(([chave, rotulo]) =>
      console.log(
        `    ${rotulo}: ${formatar(piso[chave])} → ${formatar(atual[chave])}`,
      ),
    );
  }
};

main();
