/** Atualiza a coluna Codex das tabelas sem reescrever a prosa do roadmap.
 * node scripts/gerar-modelos-codex.js [--check]
 */
const fs = require('node:fs');
const path = require('node:path');
const { lerTarefas, CODEX_MODEL_INFO, repoRoot } = require('./lib/roadmap');
const caminho = path.join(repoRoot, 'docs/ROADMAP-JOGO-COMPLETO.md');
const original = fs.readFileSync(caminho, 'utf8');
const tarefas = new Map(lerTarefas().map((t) => [t.id, t]));
const encontrados = new Set();
let tabela = false;
let coluna = -1;
const linhas = original.split(/\r?\n/).map((linha) => {
  if (!linha.startsWith('|')) {
    tabela = false;
    return linha;
  }
  const partes = linha.split(/(?<!\\)\|/);
  if (partes[1].trim() === 'ID') {
    tabela = true;
    coluna = partes.findIndex((p) => p.trim() === 'Codex');
    if (coluna < 0) partes.splice(partes.length - 1, 0, ' Codex ');
  } else if (tabela && /^\s*-+\s*$/.test(partes[1])) {
    if (coluna < 0) partes.splice(partes.length - 1, 0, ' ----- ');
  } else if (tabela) {
    const id = partes[1].trim().replace(/~/g, '');
    const t = tarefas.get(id);
    if (!t) throw new Error('Tarefa ausente no BLOCKS: ' + id);
    encontrados.add(id);
    const valor =
      ' ' +
      (t.modeloCodex ? CODEX_MODEL_INFO[t.modeloCodex].display : 'Manual') +
      ' ';
    if (coluna >= 0) {
      if (partes[coluna].trim() !== valor.trim()) partes[coluna] = valor;
    } else partes.splice(partes.length - 1, 0, valor);
  }
  return partes.join('|');
});
const faltantes = [...tarefas.keys()].filter((id) => !encontrados.has(id));
if (faltantes.length)
  throw new Error('Tarefas sem linha no markdown: ' + faltantes.join(', '));
const atualizado = linhas.join('\n');
if (process.argv.includes('--check')) {
  if (original.replace(/\r\n/g, '\n') !== atualizado) {
    console.error('Coluna Codex desatualizada.');
    process.exitCode = 1;
  } else
    console.log('Coluna Codex em sincronia: ' + encontrados.size + ' tarefas.');
} else {
  fs.writeFileSync(caminho, atualizado);
  console.log('Coluna Codex atualizada: ' + encontrados.size + ' tarefas.');
}
