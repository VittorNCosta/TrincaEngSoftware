/**
 * Orçamento de tamanho do bundle JS/Hermes (Q-10).
 *
 * CI-12 já orça `assets/` — o que decide o download do APK. Isto orça o
 * outro lado: o `.hbc` que o Metro empacota e o Hermes compila a partir de
 * `src/` + `node_modules`, que decide o tempo de parse/carga no aparelho a
 * cada abertura do app.
 *
 * `npx expo export --platform android` gera exatamente o artefato que o
 * build de produção embarca — mesmo minify, mesmo bytecode Hermes, sem
 * sourcemap (a flag de sourcemap é opt-in, `-s`) — não uma aproximação.
 *
 * Mesmo idioma dos outros guardas (cobertura, ODS 12, assets, auditoria):
 * grava o teto medido em `scripts/bundle-orcamento.json` em vez de um número
 * chutado no código-fonte, e só sobe de propósito.
 *
 * O bundle é *quase* reproduzível: em cinco execuções seguidas sobre o mesmo
 * código, sem nenhuma mudança, o `.hbc` variou 2 bytes (2.620.794 a
 * 2.620.796 — Metro não garante ordem estável de módulo byte a byte, só
 * tamanho estável). Um teto exato reprovaria PR nenhum ao acaso. Por isso o
 * teto de verdade tem `MARGEM_DE_RUIDO` de folga sobre o medido — grande o
 * bastante para absorver esse ruído, pequeno o bastante para continuar
 * pegando código novo de verdade.
 *
 * Depois de mudar código de um jeito que legitimamente muda o bundle:
 *
 *     npm run orcamento:bundle -- --atualizar
 *
 * Aumentar o teto exige `--atualizar --permitir-alta`, para que crescer a
 * régua seja um ato explícito e visível no diff, não efeito colateral de
 * rodar o comando errado depois de encolher o bundle.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const orcamentoPath = path.join(__dirname, 'bundle-orcamento.json');

/**
 * 1%: cerca de 26 KB sobre os ~2,6 MB de hoje. Bem acima dos 2 bytes de
 * ruído medidos entre execuções, e ainda assim pequeno o bastante para uma
 * dependência nova ou uma tela nova estourar o teto de verdade.
 */
const MARGEM_DE_RUIDO = 0.01;

class ErroDeMedicao extends Error {}

const medir = () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orcamento-bundle-'));

  try {
    const { status, stdout, stderr } = spawnSync(
      'npx',
      ['expo', 'export', '--platform', 'android', '--output-dir', outputDir],
      { cwd: projectRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );

    process.stdout.write(stdout ?? '');
    process.stderr.write(stderr ?? '');

    if (status !== 0) {
      throw new ErroDeMedicao(
        'expo export falhou; sem bundle não há o que medir.',
      );
    }

    const bundleDir = path.join(outputDir, '_expo', 'static', 'js', 'android');
    const arquivos = fs.existsSync(bundleDir)
      ? fs.readdirSync(bundleDir).filter((nome) => nome.endsWith('.hbc'))
      : [];

    if (arquivos.length === 0) {
      throw new ErroDeMedicao(`nenhum bundle .hbc encontrado em ${bundleDir}.`);
    }

    return arquivos.reduce(
      (soma, nome) => soma + fs.statSync(path.join(bundleDir, nome)).size,
      0,
    );
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
};

const lerOrcamento = () =>
  fs.existsSync(orcamentoPath)
    ? JSON.parse(fs.readFileSync(orcamentoPath, 'utf8'))
    : null;

const gravarOrcamento = (medido) => {
  const teto = Math.ceil(medido * (1 + MARGEM_DE_RUIDO));

  fs.writeFileSync(
    orcamentoPath,
    `${JSON.stringify(
      {
        _leia:
          'Teto do bundle Android (Hermes), gerado por ' +
          'scripts/orcamento-bundle.js --atualizar. `teto` = `medido` * ' +
          '(1 + MARGEM_DE_RUIDO), e e o numero que a checagem de fato usa. ' +
          'So sobe de proposito: aumentar exige --atualizar --permitir-alta.',
        medido,
        teto,
        megabytes: Number((teto / (1024 * 1024)).toFixed(2)),
      },
      null,
      2,
    )}\n`,
  );

  return teto;
};

const formatarMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

/** Mesma técnica de CI-10: sem `pull-requests: write`, só o resumo do job. */
const publicarResumo = (atual, teto, ok) => {
  const destino = process.env.GITHUB_STEP_SUMMARY;

  if (!destino) {
    return;
  }

  const linhas = [
    `## Orçamento de bundle — ${ok ? 'dentro do teto' : 'acima do teto'}`,
    '',
    `Bundle Android (Hermes): **${formatarMB(atual)}** — teto ${teto ? formatarMB(teto.teto) : 'não gravado'}.`,
    '',
  ];

  fs.appendFileSync(destino, `${linhas.join('\n')}\n`);
};

const main = () => {
  const atualizar = process.argv.includes('--atualizar');
  const permitirAlta = process.argv.includes('--permitir-alta');

  console.log('medindo o bundle (npx expo export --platform android)...');

  const atual = medir();
  const teto = lerOrcamento();

  console.log(`bundle android: ${formatarMB(atual)}`);

  if (atualizar) {
    const tetoNovo = Math.ceil(atual * (1 + MARGEM_DE_RUIDO));

    if (teto && tetoNovo > teto.teto && !permitirAlta) {
      console.error(
        `\n✖ isso subiria o teto: ${formatarMB(teto.teto)} → ${formatarMB(tetoNovo)}.\n` +
          '\n  Se o crescimento for legítimo (tela nova, dependência nova), repita\n' +
          '  com --permitir-alta para o diff mostrar a decisão.\n',
      );
      process.exitCode = 1;
      return;
    }

    gravarOrcamento(atual);
    console.log(
      `\nteto atualizado: ${formatarMB(tetoNovo)} (medido ${formatarMB(atual)})`,
    );
    return;
  }

  publicarResumo(atual, teto, teto != null && atual <= teto.teto);

  if (!teto) {
    console.error(
      '\n✖ scripts/bundle-orcamento.json não existe.\n' +
        '  Rode `npm run orcamento:bundle -- --atualizar` para gravar o teto inicial.\n',
    );
    process.exitCode = 1;
    return;
  }

  if (atual > teto.teto) {
    console.error(
      `\n✖ bundle acima do teto: ${formatarMB(atual)} > ${formatarMB(teto.teto)}.\n` +
        '  Se o crescimento for legítimo, rode `npm run orcamento:bundle -- --atualizar\n' +
        '  --permitir-alta` e explique o motivo no commit — não apague a checagem.\n',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nno teto: ${formatarMB(atual)} <= ${formatarMB(teto.teto)}`);
};

try {
  main();
} catch (erro) {
  if (erro instanceof ErroDeMedicao) {
    console.error(`\n✖ ${erro.message}\n`);
    process.exitCode = 1;
  } else {
    throw erro;
  }
}
