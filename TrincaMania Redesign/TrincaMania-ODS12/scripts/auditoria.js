/**
 * Guarda de vulnerabilidade de dependência (SEC-06).
 *
 * ## Por que não é `npm audit --audit-level=high` puro
 *
 * Porque hoje ele reprova. São 11 advisories abertos (6 high, 5 moderate) em
 * cinco pacotes — `@xmldom/xmldom`, `browserslist`, `image-size`, `postcss`,
 * `uuid` —, e nenhum deles é dependência direta daqui: todos entram pela
 * cadeia do Expo (`@expo/config`, `@expo/prebuild-config`, `jest-expo`,
 * `expo-constants`). Corrigir passa por subir o major do Expo, que é uma
 * decisão de projeto, não um `npm audit fix`.
 *
 * (O `npm audit` mostra 19 linhas em `vulnerabilities`, não 11: ele lista um nó
 * por pacote afetado, e o mesmo advisory reaparece em cada caminho da árvore.
 * O que este script conta é advisory distinto — ver `coletarAdvisories`.)
 *
 * Um gate que nasce vermelho tem um destino só: alguém o desliga. E aí a
 * vulnerabilidade que importava — a que chegar amanhã, num pacote que hoje
 * está limpo — entra sem ninguém ver.
 *
 * ## Livro-razão, o mesmo idioma das outras guardas
 *
 * Igual a `guarda-ods12.js` e `valida-assets.js`: em vez de reprovar no saldo
 * atual, compara com `scripts/auditoria-baseline.json` e reprova em dois casos.
 *
 * 1. **Advisory novo** com severidade >= o piso (`high` por padrão). É
 *    regressão: entrou dívida que ninguém decidiu aceitar.
 * 2. **Entrada morta** — está no livro-razão e não aparece mais. O saldo tem
 *    que encolher de verdade; sem isso o arquivo vira decoração e daqui a um
 *    ano ninguém sabe mais o que ainda é real.
 *
 * Advisory abaixo do piso é listado e não reprova — serve de aviso.
 *
 * Depois de corrigir (ou de decidir aceitar) uma vulnerabilidade:
 *
 *     npm run auditoria -- --atualizar
 *
 * A chave é `pacote::id-do-advisory`, não a versão: versão muda a cada
 * `npm install` e transformaria a guarda numa fonte de falha aleatória. O id
 * do advisory é estável e é o que identifica a vulnerabilidade de fato — CVE
 * novo no mesmo pacote entra como entrada nova e reprova, que é o que se quer.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const baselinePath = path.join(__dirname, 'auditoria-baseline.json');

/** Piso que reprova. Abaixo disto, o advisory é só informado. */
const PISO = 'high';

const ORDEM = ['info', 'low', 'moderate', 'high', 'critical'];
const pesoDe = (severidade) => {
  const peso = ORDEM.indexOf(severidade);
  return peso < 0 ? 0 : peso;
};

const atualizar = process.argv.includes('--atualizar');

/** Quantas vezes tentar antes de desistir do registry. */
const TENTATIVAS = 3;

/**
 * Teto de cada tentativa.
 *
 * Não é zelo preventivo: o registry já respondeu 503 numa execução e, noutra,
 * simplesmente não respondeu — três `npm audit` ficaram pendurados até serem
 * mortos à mão. Sem teto, o modo de falha em CI não é job vermelho, é job
 * ocupando runner até o limite do workflow.
 */
const TIMEOUT_MS = 90_000;

const dormir = (ms) => {
  // Espera síncrona de propósito: o script é um utilitário sequencial e
  // transformá-lo em assíncrono só para dar um intervalo entre tentativas
  // espalharia `await` por tudo sem ganhar nada.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/**
 * Uma execução de `npm audit --json`.
 *
 * O comando sai com código 1 quando encontra vulnerabilidade — que é o caso
 * normal aqui —, então o status não serve para detectar erro. O que distingue
 * "achou vulnerabilidade" de "não consegui falar com o registry" é a saída ser
 * um relatório com `vulnerabilities` ou o JSON de erro do npm.
 */
const tentarAudit = () => {
  const resultado = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['audit', '--json'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
    },
  );

  // Estouro de tempo chega como `error.code === 'ETIMEDOUT'` — é registry
  // inacessível, não npm quebrado, então entra na mesma porta de saída do 503.
  if (resultado.error) {
    const expirou =
      resultado.error.code === 'ETIMEDOUT' || resultado.signal === 'SIGKILL';

    return {
      erro: expirou
        ? `npm audit não respondeu em ${TIMEOUT_MS / 1000}s`
        : `não foi possível rodar o npm: ${resultado.error.message}`,
      indisponivel: expirou,
    };
  }

  let relatorio;

  try {
    relatorio = JSON.parse(resultado.stdout);
  } catch {
    return {
      erro: `\`npm audit --json\` não devolveu JSON: ${(resultado.stderr || resultado.stdout || '').trim().slice(0, 300)}`,
    };
  }

  if (!relatorio || typeof relatorio.vulnerabilities !== 'object') {
    return {
      erro: `relatório sem \`vulnerabilities\`: ${JSON.stringify(relatorio).slice(0, 300)}`,
      indisponivel:
        /5\d\d |ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN|Service Unavailable/i.test(
          JSON.stringify(relatorio),
        ),
    };
  }

  return { relatorio };
};

/**
 * Roda o audit com retentativa.
 *
 * ## Registry fora do ar não é vulnerabilidade
 *
 * `npm audit` depende de um POST ao registry, e o registry cai — este script
 * nasceu vendo um `503 Service Unavailable` na primeira execução. Se um 503
 * deixasse o job vermelho, o efeito prático seria treinar todo mundo a ignorar
 * a cor deste job, e aí a vulnerabilidade de verdade passaria despercebida
 * junto com o ruído.
 *
 * Então: tenta três vezes com espera crescente e, se o registry continuar
 * inacessível, avisa alto e sai com 0. O agendamento semanal do
 * `.github/workflows/seguranca.yml` garante que a verificação volta a
 * acontecer sozinha. Falha de análise — JSON quebrado, npm ausente — continua
 * reprovando, porque aí o problema é local e reproduzível.
 */
const rodarAudit = () => {
  let ultimo;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa += 1) {
    ultimo = tentarAudit();

    if (ultimo.relatorio) {
      return ultimo.relatorio;
    }

    if (tentativa < TENTATIVAS) {
      const espera = tentativa * 3000;
      console.error(
        `  tentativa ${tentativa}/${TENTATIVAS} falhou; nova tentativa em ${espera / 1000}s`,
      );
      dormir(espera);
    }
  }

  if (ultimo.indisponivel) {
    console.error(`⚠ registry npm indisponível: ${ultimo.erro}`);
    console.error(
      '  Auditoria não verificada nesta execução. Não é reprovação — o job\n  agendado de segunda-feira verifica de novo.',
    );
    process.exit(0);
  }

  console.error(`✖ ${ultimo.erro}`);
  process.exit(1);
};

/**
 * Extrai os advisories reais do relatório.
 *
 * `vulnerabilities` lista um nó por pacote afetado, e a maioria é afetada só
 * por tabela: o `via` dela é uma string com o nome do pacote que tem o
 * problema de verdade. Advisory mesmo é o `via` que vem como objeto, com
 * `source`, `title` e `url`. Coletar só esses dá o conjunto canônico — sem ele
 * o livro-razão teria uma entrada por caminho de dependência, e um pacote novo
 * na árvore mudaria o saldo sem nenhuma vulnerabilidade nova ter surgido.
 */
const coletarAdvisories = (relatorio) => {
  const porChave = new Map();

  for (const registro of Object.values(relatorio.vulnerabilities)) {
    for (const via of registro.via ?? []) {
      if (typeof via !== 'object' || via.source == null) {
        continue;
      }

      const chave = `${via.name ?? registro.name}::${via.source}`;

      if (!porChave.has(chave)) {
        porChave.set(chave, {
          chave,
          pacote: via.name ?? registro.name,
          advisory: via.source,
          severidade: via.severity ?? registro.severity ?? 'info',
          titulo: via.title ?? '',
          url: via.url ?? '',
        });
      }
    }
  }

  return [...porChave.values()].sort((a, b) => a.chave.localeCompare(b.chave));
};

const lerBaseline = () => {
  if (!fs.existsSync(baselinePath)) {
    return { entradas: {} };
  }

  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
};

const escreverBaseline = (advisories) => {
  const entradas = {};

  for (const a of advisories) {
    entradas[a.chave] = {
      severidade: a.severidade,
      titulo: a.titulo,
      url: a.url,
    };
  }

  const conteudo = {
    _leia: `Livro-razao de vulnerabilidades aceitas, gerado por scripts/auditoria.js --atualizar. Reprova em advisory novo com severidade >= ${PISO} e em entrada que nao existe mais. A chave e pacote::id-do-advisory.`,
    piso: PISO,
    entradas,
  };

  fs.writeFileSync(baselinePath, `${JSON.stringify(conteudo, null, 2)}\n`);
};

const main = () => {
  const advisories = coletarAdvisories(rodarAudit());

  if (atualizar) {
    escreverBaseline(advisories);
    console.log(
      `livro-razao atualizado: ${advisories.length} advisories em ${path.relative(projectRoot, baselinePath)}`,
    );
    return;
  }

  const baseline = lerBaseline();
  const conhecidas = new Set(Object.keys(baseline.entradas ?? {}));
  const atuais = new Set(advisories.map((a) => a.chave));

  const novas = advisories.filter((a) => !conhecidas.has(a.chave));
  const mortas = [...conhecidas].filter((chave) => !atuais.has(chave));

  const novasQueReprovam = novas.filter(
    (a) => pesoDe(a.severidade) >= pesoDe(PISO),
  );
  const novasAbaixoDoPiso = novas.filter(
    (a) => pesoDe(a.severidade) < pesoDe(PISO),
  );

  console.log(
    `auditoria: ${advisories.length} advisories | ${conhecidas.size} no livro-razao`,
  );

  if (novasAbaixoDoPiso.length > 0) {
    console.log(
      `\naviso — ${novasAbaixoDoPiso.length} advisory(s) novo(s) abaixo de "${PISO}" (nao reprova):`,
    );
    for (const a of novasAbaixoDoPiso) {
      console.log(`  ${a.severidade.padEnd(8)} ${a.chave}  ${a.titulo}`);
    }
  }

  let reprovou = false;

  if (novasQueReprovam.length > 0) {
    reprovou = true;
    console.error(
      `\n✖ ${novasQueReprovam.length} advisory(s) novo(s) com severidade >= ${PISO}:`,
    );
    for (const a of novasQueReprovam) {
      console.error(`  ${a.severidade.padEnd(8)} ${a.chave}  ${a.titulo}`);
      if (a.url) {
        console.error(`           ${a.url}`);
      }
    }
    console.error(
      '\n  Corrija (`npm audit fix`, subir a dependencia) ou, se for divida aceita\n  conscientemente, registre com: npm run auditoria -- --atualizar',
    );
  }

  if (mortas.length > 0) {
    reprovou = true;
    console.error(
      `\n✖ ${mortas.length} entrada(s) do livro-razao que nao existem mais:`,
    );
    for (const chave of mortas) {
      console.error(`  ${chave}`);
    }
    console.error(
      '\n  A divida encolheu — atualize o saldo: npm run auditoria -- --atualizar',
    );
  }

  if (reprovou) {
    process.exit(1);
  }

  console.log('✔ nenhuma vulnerabilidade nova acima do piso.');
};

main();
