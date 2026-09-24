#!/usr/bin/env node
/**
 * Marca uma tarefa do roadmap como concluída nas duas superfícies de uma vez.
 *
 *     node scripts/feito.js C-08b "Trocado por `theme: 'recycling'`; guarda caiu para 13."
 *     node scripts/feito.js C-08b                # só marca ✅, mantém o detalhe
 *     node scripts/feito.js C-08b --data 12/09   # data diferente de hoje
 *
 * ## Por que existe
 *
 * Marcar uma tarefa como feita exigia três edições à mão: o `BLOCKS` de
 * `docs/roadmap/roadmap.html`, a linha da tabela em
 * `docs/ROADMAP-JOGO-COMPLETO.md` e a issue no GitHub. Três lugares, mesma
 * informação, nenhum verificando o outro — e o resultado previsível aconteceu:
 * o markdown ficou uma semana à frente do HTML, que é a fonte de dados, e
 * ninguém percebeu porque nada quebra quando um doc mente.
 *
 * Este script cuida das duas superfícies locais. A terceira é uma chamada de
 * rede e fica com quem já faz isso por delta:
 *
 *     node scripts/sincronizar-issues.js --aplicar
 *
 * ## Como edita o HTML sem reescrever o arquivo
 *
 * Cada tarefa ocupa uma linha só, no formato `["ID","título","quem",N,"detalhe"],`
 * — que é um array JSON válido. Então a edição é: achar a linha do id, fazer
 * `JSON.parse` dela, trocar os campos e `JSON.stringify` de volta. Nada de
 * reserializar o `BLOCKS` inteiro, que reformataria as 199 linhas e faria o
 * diff da mudança de uma tarefa parecer uma reescrita do roadmap.
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const caminhoHtml = path.join(repoRoot, 'docs/roadmap/roadmap.html');
const caminhoMd = path.join(repoRoot, 'docs/ROADMAP-JOGO-COMPLETO.md');

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
const iData = argv.indexOf('--data');
const data =
  iData >= 0 && argv[iData + 1]
    ? argv[iData + 1]
    : new Date()
        .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        .replace(/\//g, '/');

/** O texto é tudo que não é o id nem opção — juntado, para não exigir aspas. */
const texto = argv
  .filter((a, i) => a !== id && !a.startsWith('--') && i !== iData + 1)
  .join(' ')
  .trim();

if (!id) {
  console.error(
    'uso: node scripts/feito.js <ID> ["o que foi feito"] [--data DD/MM]',
  );
  process.exit(1);
}

/** Markdown que a pessoa digita → o HTML que o `BLOCKS` usa. É o inverso de `toMarkdown`. */
const paraHtml = (valor) =>
  String(valor)
    .replace(/&/g, '&amp;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

const atualizarHtml = () => {
  const linhas = fs.readFileSync(caminhoHtml, 'utf8').split('\n');
  const prefixo = `["${id}",`;
  const alvo = linhas.findIndex((linha) =>
    linha.trimStart().startsWith(prefixo),
  );

  if (alvo < 0) {
    console.error(
      `✖ ${id} não encontrado em ${path.relative(repoRoot, caminhoHtml)}`,
    );
    process.exit(1);
  }

  const linha = linhas[alvo];
  const recuo = linha.slice(0, linha.length - linha.trimStart().length);
  const virgula = linha.trimEnd().endsWith(',');
  const tarefa = JSON.parse(linha.trim().replace(/,$/, ''));

  const jaFeita = String(tarefa[1]).startsWith('✅');
  tarefa[1] = jaFeita ? tarefa[1] : `✅ ${tarefa[1]}`;

  const marcador = `<b>Feito ${data}.</b>`;
  const detalheAtual = String(tarefa[4] ?? '');
  // Um marcador de "Feito" que já exista é substituído, não empilhado: rodar o
  // script duas vezes na mesma tarefa não pode gerar "Feito 04/09. Feito 05/09.".
  const semMarcador = detalheAtual
    .replace(/^<b>(?:Feito|Decidido)[^<]*<\/b>\s*/, '')
    .trim();

  tarefa[4] = texto
    ? `${marcador} ${paraHtml(texto)}`
    : `${marcador} ${semMarcador}`;

  linhas[alvo] = `${recuo}${JSON.stringify(tarefa)}${virgula ? ',' : ''}`;
  fs.writeFileSync(caminhoHtml, linhas.join('\n'));

  return { jaFeita, titulo: String(tarefa[1]).replace(/^✅\s*/, '') };
};

const atualizarMarkdown = () => {
  const conteudo = fs.readFileSync(caminhoMd, 'utf8');
  const linhas = conteudo.split('\n');
  // A tabela usa tanto `| C-19 |` quanto `| ~~C-01~~ |` para o id — as duas
  // convenções de "feito" que o documento acumulou.
  const alvo = linhas.findIndex((linha) =>
    new RegExp(
      `^\\|\\s*(~~)?${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(~~)?\\s*\\|`,
    ).test(linha),
  );

  if (alvo < 0) {
    return false;
  }

  const celulas = linhas[alvo].split('|');

  // `| id | titulo | quem | prio | detalhe |` → índices 1..5 entre as barras.
  if (celulas.length < 6) {
    return false;
  }

  const titulo = celulas[2].trim();
  if (!titulo.startsWith('✅') && !titulo.startsWith('~~')) {
    celulas[2] = ` ✅ ${titulo} `;
  }

  const detalhe = celulas[5]
    .trim()
    .replace(/^\*\*(?:Feito|Decidido)[^*]*\*\*\s*/, '');
  celulas[5] = ` **Feito ${data}.** ${texto || detalhe} `;

  linhas[alvo] = celulas.join('|');
  fs.writeFileSync(caminhoMd, linhas.join('\n'));
  return true;
};

const { jaFeita, titulo } = atualizarHtml();
const noMarkdown = atualizarMarkdown();

console.log(`${id} · ${titulo}`);
console.log(
  `  roadmap.html            ${jaFeita ? 'já estava ✅, detalhe atualizado' : 'marcada ✅'}`,
);
console.log(
  `  ROADMAP-JOGO-COMPLETO   ${noMarkdown ? 'linha atualizada' : '⚠ linha não encontrada — confira à mão'}`,
);
console.log('\nPróximos passos:');
console.log('  npm run format          # a tabela do markdown realinha');
console.log(
  '  node scripts/sincronizar-issues.js            # confere o delta',
);
console.log('  node scripts/sincronizar-issues.js --aplicar  # fecha a issue');
