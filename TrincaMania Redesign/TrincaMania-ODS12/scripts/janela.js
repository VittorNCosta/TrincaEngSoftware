#!/usr/bin/env node
/**
 * Janela de trabalho: para de executar sozinho nos horários em que você sai.
 *
 *     node scripts/janela.js --status          # em que fase a janela está
 *     node scripts/janela.js --liberar [min]   # solta o bloqueio por N minutos
 *     node scripts/janela.js --hook PreToolUse # uso interno dos hooks
 *
 * ## Por que existe
 *
 * Às 16h você troca de máquina (sai do trabalho) e às 22h você sai da
 * faculdade. Uma sessão que continua rodando depois disso trabalha sozinha
 * sem ninguém olhando, e o que ela produziu fica preso na máquina errada.
 *
 * Então cada corte tem três tempos:
 *
 *   - **aviso** (20 min antes): todo uso de ferramenta recebe um lembrete
 *     para fechar o que está aberto — commitar e anotar o ponto de parada.
 *   - **corte**: a janela fecha. Antes de bloquear, faz o encerramento
 *     automático (ver abaixo) e devolve `continue: false`, que interrompe a
 *     execução de verdade — não é um pedido, a sessão para.
 *   - **fechado** (90 min): segue bloqueando. É a janela do deslocamento.
 *
 * Depois disso volta a ficar livre sozinha: bloquear a noite inteira só
 * atrapalharia quem senta para trabalhar às 23h.
 *
 * ## A saída de emergência
 *
 * Bloqueio que não sabe se você está presente vira estorvo. Por isso um
 * **prompt seu** libera: se você digitou, você está aí. Cada mensagem sua
 * renova uma licença de 45 min, nunca além do próximo corte. Quem fica de
 * fora é exatamente o caso que motivou tudo isto — a sessão que continua
 * puxando tarefa depois que você fechou o notebook.
 *
 * ## Encerramento automático
 *
 * No corte, com a árvore suja: `git add -A`, commit de ponto de parada e
 * push. Os dois com `--no-verify`, de propósito — o `pre-push` roda
 * `tsc --noEmit`, e trabalho pela metade tipicamente não compila. Um
 * checkpoint que só sobe quando o código está redondo não serve para nada
 * justamente no dia em que serviria. Reescrever o commit depois é barato
 * (`git reset --soft HEAD~1`); recuperar trabalho que ficou na outra máquina
 * não é.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/** Ajuste por variável de ambiente; `JANELA_OFF=1` desliga tudo. */
const PADRAO = {
  fuso: 'America/Sao_Paulo',
  cortes: ['16:00', '22:00'],
  avisoMin: 20,
  fechadoMin: 90,
  gracaMin: 45,
  commita: true,
  sobe: true,
};

const MIN = 60 * 1000;
const DIA_EM_MIN = 24 * 60;

const lerConfig = (env = process.env) => ({
  fuso: env.JANELA_FUSO || PADRAO.fuso,
  cortes: env.JANELA_CORTES
    ? env.JANELA_CORTES.split(',').map((c) => c.trim())
    : PADRAO.cortes,
  avisoMin: Number(env.JANELA_AVISO_MIN) || PADRAO.avisoMin,
  fechadoMin: Number(env.JANELA_FECHADO_MIN) || PADRAO.fechadoMin,
  gracaMin: Number(env.JANELA_GRACA_MIN) || PADRAO.gracaMin,
  commita: env.JANELA_COMMITA !== '0',
  sobe: env.JANELA_SOBE !== '0',
  desligada: env.JANELA_OFF === '1',
});

const paraMinutos = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

const paraHhmm = (minutos) => {
  const m = ((minutos % DIA_EM_MIN) + DIA_EM_MIN) % DIA_EM_MIN;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Relógio de parede no fuso pedido — a máquina pode estar em outro. */
const relogio = (agora, fuso) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .formatToParts(agora)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

  // en-CA devolve "24" para a meia-noite em algumas versões do ICU.
  const hora = partes.hour === '24' ? '00' : partes.hour;
  return {
    dia: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(hora) * 60 + Number(partes.minute),
  };
};

/**
 * Em que fase a janela está. Função pura: recebe o instante e o estado
 * gravado, não lê relógio nem disco — é o que o teste exercita.
 *
 * @returns {{fase: 'livre'|'aviso'|'fechado'|'liberado', corte?: string,
 *            minutos?: number, chave?: string, liberadoAte?: number}}
 */
const avaliar = ({ agora, config, liberadoAte = 0 }) => {
  if (config.desligada) return { fase: 'livre' };

  const { dia, minutos } = relogio(agora, config.fuso);
  let aviso = null;
  let fechado = null;

  for (const corte of config.cortes) {
    const base = paraMinutos(corte);
    // O corte de ontem também conta: a fase fechada pode cruzar a meia-noite.
    for (const inicio of [base, base - DIA_EM_MIN]) {
      const passados = minutos - inicio;
      if (passados < 0 && -passados <= config.avisoMin) {
        aviso = { corte, minutos: -passados };
      }
      if (passados >= 0 && passados < config.fechadoMin) {
        fechado = { corte, minutos: passados, chave: `${dia}T${corte}` };
      }
    }
  }

  if (fechado) {
    return agora.getTime() < liberadoAte
      ? { fase: 'liberado', ...fechado, liberadoAte }
      : { fase: 'fechado', ...fechado };
  }
  if (aviso) return { fase: 'aviso', ...aviso };
  return { fase: 'livre' };
};

/** Licença nunca passa do próximo corte — senão ela mesma fura a janela. */
const limitarLicenca = ({ agora, config, minutosPedidos }) => {
  const { minutos } = relogio(agora, config.fuso);
  const faltamAteOProximoCorte = config.cortes
    .map((c) => paraMinutos(c) - minutos)
    .map((d) => (d > 0 ? d : d + DIA_EM_MIN))
    .sort((a, b) => a - b)[0];
  return (
    agora.getTime() + Math.min(minutosPedidos, faltamAteOProximoCorte) * MIN
  );
};

// --- disco -----------------------------------------------------------------

const raizGit = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: __dirname,
  encoding: 'utf8',
}).trim();

const dirClaude = path.join(raizGit, '.claude');
const caminhoEstado = path.join(dirClaude, 'janela.json');
const caminhoNota = path.join(dirClaude, 'estado-nota.txt');

const lerEstado = () => {
  try {
    return JSON.parse(fs.readFileSync(caminhoEstado, 'utf8'));
  } catch {
    return {};
  }
};

const gravarEstado = (estado) => {
  fs.mkdirSync(dirClaude, { recursive: true });
  fs.writeFileSync(caminhoEstado, `${JSON.stringify(estado, null, 2)}\n`);
};

/** Git nunca derruba o hook: erro vira linha de relatório. */
const git = (...args) => {
  try {
    const saida = execFileSync('git', args, {
      cwd: raizGit,
      encoding: 'utf8',
      timeout: 60 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Sem terminal para pedir senha: falhar rápido é melhor que travar
        // o hook até o timeout.
        GIT_TERMINAL_PROMPT: '0',
        GIT_SSH_COMMAND:
          'ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new',
      },
    });
    return { ok: true, saida: String(saida).trim() };
  } catch (erro) {
    return { ok: false, saida: String(erro.stderr || erro.message).trim() };
  }
};

/** Regenera `.claude/estado.md` reaproveitando o gerador já existente. */
const regenerarEstado = () => {
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'estado.js')], {
      cwd: raizGit,
      stdio: 'ignore',
      timeout: 30 * 1000,
    });
  } catch {
    /* estado.md desatualizado não justifica derrubar o encerramento */
  }
};

/**
 * O que a janela faz sozinha no corte. Roda uma vez por corte — a chave
 * (`dia + hora`) fica gravada para o bloqueio seguinte não repetir commit.
 */
const encerrar = ({ config, chave, corte, estado }) => {
  if (estado.ultimoEncerramento === chave) return [];
  estado.ultimoEncerramento = chave;

  const passos = [];
  const sujo = git('status', '--porcelain').saida;

  if (sujo && config.commita) {
    const mensagem = [
      `chore: ponto de parada automatico do corte das ${corte}`,
      '',
      'Commit gerado por scripts/janela.js, sem revisao humana: e um',
      'checkpoint para o trabalho nao ficar preso nesta maquina. Pode ser',
      'reescrito com `git reset --soft HEAD~1`.',
    ].join('\n');

    const add = git('add', '-A');
    const commit = add.ok
      ? git('commit', '--no-verify', '-m', mensagem)
      : { ok: false, saida: add.saida };
    passos.push(
      commit.ok
        ? `commit de ponto de parada criado (${sujo.split('\n').length} arquivo(s))`
        : `commit falhou: ${commit.saida.split('\n')[0]}`,
    );
  } else if (sujo) {
    passos.push(
      `${sujo.split('\n').length} arquivo(s) sujo(s), commit desligado`,
    );
  }

  if (config.sobe) {
    const temUpstream = git(
      'rev-parse',
      '--abbrev-ref',
      '--symbolic-full-name',
      '@{u}',
    ).ok;
    const push = temUpstream
      ? git('push', '--no-verify')
      : git('push', '--no-verify', '-u', 'origin', 'HEAD');
    passos.push(
      push.ok
        ? 'push para o origin feito'
        : `push falhou: ${push.saida.split('\n')[0]}`,
    );
  }

  try {
    fs.mkdirSync(dirClaude, { recursive: true });
    fs.appendFileSync(
      caminhoNota,
      `\n[janela ${chave}] sessao encerrada automaticamente. ${passos.join('; ')}.\n`,
    );
  } catch {
    /* nota é conveniência; o estado.md abaixo já conta a história */
  }
  regenerarEstado();

  return passos;
};

// --- saída dos hooks -------------------------------------------------------

const emitir = (obj) => process.stdout.write(`${JSON.stringify(obj)}\n`);

const contexto = (evento, texto) =>
  emitir({
    hookSpecificOutput: { hookEventName: evento, additionalContext: texto },
    suppressOutput: true,
  });

const lerEntrada = () => {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
};

/** A própria janela precisa continuar acessível quando ela bloqueia tudo. */
const eEscapeDaJanela = (entrada) =>
  entrada.tool_name === 'Bash' &&
  /janela\.js/.test(String(entrada.tool_input?.command || ''));

const naFerramenta = ({ agora, config, estado, entrada }) => {
  const situacao = avaliar({ agora, config, liberadoAte: estado.liberadoAte });

  if (situacao.fase === 'fechado' && !eEscapeDaJanela(entrada)) {
    const passos = encerrar({ ...situacao, config, estado });
    gravarEstado(estado);
    const feito = passos.length ? ` Encerramento: ${passos.join('; ')}.` : '';
    return emitir({
      continue: false,
      stopReason:
        `Janela fechada — passou das ${situacao.corte} (${config.fuso}), ` +
        `o horario em que voce sai.${feito} Reabre sozinha em ` +
        `${config.fechadoMin - situacao.minutos} min; para seguir agora, ` +
        `mande qualquer mensagem ou rode ` +
        `\`node scripts/janela.js --liberar 60\`.`,
    });
  }

  if (situacao.fase === 'aviso') {
    // Um aviso por ferramenta seria ruído; de 10 em 10 minutos basta.
    if (agora.getTime() - (estado.ultimoAviso || 0) < 10 * MIN) return;
    estado.ultimoAviso = agora.getTime();
    gravarEstado(estado);
    return contexto(
      'PreToolUse',
      `Faltam ${situacao.minutos} min para o corte das ${situacao.corte} ` +
        `(${config.fuso}) — o horario em que o usuario sai e a janela para de ` +
        `executar. Nao comece tarefa nova: feche a atual, commite o que der e ` +
        `rode \`node scripts/estado.js --nota "..."\` com o ponto exato de ` +
        `parada. No corte a janela commita e sobe o resto sozinha.`,
    );
  }
};

const noPrompt = ({ agora, config, estado }) => {
  const situacao = avaliar({ agora, config, liberadoAte: estado.liberadoAte });
  if (situacao.fase !== 'fechado' && situacao.fase !== 'liberado') return;

  estado.liberadoAte = limitarLicenca({
    agora,
    config,
    minutosPedidos: config.gracaMin,
  });
  gravarEstado(estado);

  const ate = relogio(new Date(estado.liberadoAte), config.fuso);
  contexto(
    'UserPromptSubmit',
    `A janela de trabalho esta fechada (passou das ${situacao.corte}), mas o ` +
      `usuario acabou de escrever — entao ele esta presente e a execucao ` +
      `segue liberada ate ${paraHhmm(ate.minutos)}. Trabalhe em passos curtos ` +
      `e deixe commit e nota em dia: quando a licenca vencer, a execucao para ` +
      `no meio.`,
  );
};

// --- CLI -------------------------------------------------------------------

const principal = () => {
  const argv = process.argv.slice(2);
  const config = lerConfig();
  const estado = lerEstado();
  const agora = new Date();

  const iHook = argv.indexOf('--hook');
  if (iHook >= 0) {
    const evento = argv[iHook + 1];
    if (evento === 'UserPromptSubmit') noPrompt({ agora, config, estado });
    else naFerramenta({ agora, config, estado, entrada: lerEntrada() });
    return;
  }

  const iLiberar = argv.indexOf('--liberar');
  if (iLiberar >= 0) {
    const minutosPedidos = Number(argv[iLiberar + 1]) || config.gracaMin;
    estado.liberadoAte = limitarLicenca({ agora, config, minutosPedidos });
    gravarEstado(estado);
    const ate = relogio(new Date(estado.liberadoAte), config.fuso);
    console.log(
      `Janela liberada ate ${paraHhmm(ate.minutos)} (${config.fuso}).`,
    );
    return;
  }

  const situacao = avaliar({ agora, config, liberadoAte: estado.liberadoAte });
  const { minutos } = relogio(agora, config.fuso);
  const descricao = {
    livre: 'livre — nenhum corte por perto.',
    aviso: `aviso — faltam ${situacao.minutos} min para o corte das ${situacao.corte}.`,
    fechado: `FECHADA — o corte das ${situacao.corte} passou ha ${situacao.minutos} min.`,
    liberado: `liberada por licenca — o corte das ${situacao.corte} passou, mas voce respondeu.`,
  };
  console.log(
    `${paraHhmm(minutos)} em ${config.fuso}: ${descricao[situacao.fase]}\n` +
      `Cortes: ${config.cortes.join(', ')} | aviso ${config.avisoMin} min antes | ` +
      `fecha por ${config.fechadoMin} min | licenca de ${config.gracaMin} min.`,
  );
};

if (require.main === module) principal();

module.exports = { avaliar, lerConfig, limitarLicenca, paraHhmm, relogio };
