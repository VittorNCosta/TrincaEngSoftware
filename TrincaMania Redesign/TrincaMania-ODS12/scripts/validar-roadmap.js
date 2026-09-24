#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { lerTarefas } = require('./lib/roadmap');

function validar(tarefas, markdown) {
  const espelho = new Map();
  const erros = [];
  for (const linha of markdown.split('\n')) {
    const colunas = linha.split('|');
    const id = colunas[1]?.trim().replace(/~/g, '');
    if (!/^[A-Z]+\d*-\d+[a-z]?$/.test(id ?? '')) continue;
    if (espelho.has(id)) erros.push(`${id}: duplicada no Markdown`);
    espelho.set(
      id,
      /✅/.test(colunas[2] ?? '') || /^\s*✅/.test(colunas[5] ?? ''),
    );
  }
  const ids = new Set();
  for (const tarefa of tarefas) {
    if (ids.has(tarefa.id)) erros.push(`${tarefa.id}: duplicada no HTML`);
    ids.add(tarefa.id);
    if (!espelho.has(tarefa.id))
      erros.push(`${tarefa.id}: ausente no Markdown`);
    else if (espelho.get(tarefa.id) !== tarefa.feita)
      erros.push(`${tarefa.id}: conclusão divergente`);
  }
  for (const id of espelho.keys())
    if (!ids.has(id)) erros.push(`${id}: ausente no HTML`);
  return erros;
}
if (require.main === module) {
  const erros = validar(
    lerTarefas(),
    fs.readFileSync(
      path.join(__dirname, '../docs/ROADMAP-JOGO-COMPLETO.md'),
      'utf8',
    ),
  );
  if (erros.length) {
    console.error(erros.join('\n'));
    process.exitCode = 1;
  } else console.log('Roadmap HTML/Markdown consistente: IDs e conclusão.');
}
module.exports = { validar };
