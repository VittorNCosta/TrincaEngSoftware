const test = require('node:test');
const assert = require('node:assert');

const { avaliar, limitarLicenca, paraHhmm } = require('../scripts/janela');

/**
 * A janela decide sobre o relógio de Brasília, não o da máquina — por isso
 * todo caso monta o instante em UTC e confere a fase resultante. Em setembro
 * o Brasil não tem horário de verão, então 16:00 em São Paulo é 19:00Z.
 */
const config = {
  fuso: 'America/Sao_Paulo',
  cortes: ['16:00', '22:00'],
  avisoMin: 20,
  fechadoMin: 90,
  gracaMin: 45,
  desligada: false,
};

const em = (iso) => new Date(iso);

test('longe do corte a janela fica livre', () => {
  assert.equal(
    avaliar({ agora: em('2026-09-08T13:00:00Z'), config }).fase,
    'livre',
  );
});

test('vinte minutos antes do corte entra em aviso, com a conta certa', () => {
  const situacao = avaliar({ agora: em('2026-09-08T18:45:00Z'), config });
  assert.equal(situacao.fase, 'aviso');
  assert.equal(situacao.corte, '16:00');
  assert.equal(situacao.minutos, 15);
});

test('vinte e um minutos antes ainda nao avisa', () => {
  assert.equal(
    avaliar({ agora: em('2026-09-08T18:38:00Z'), config }).fase,
    'livre',
  );
});

test('passado o corte a janela fecha', () => {
  const situacao = avaliar({ agora: em('2026-09-08T19:05:00Z'), config });
  assert.equal(situacao.fase, 'fechado');
  assert.equal(situacao.minutos, 5);
  assert.equal(situacao.chave, '2026-09-08T16:00');
});

test('a janela reabre sozinha depois da fase fechada', () => {
  // 17:35 em São Paulo: 95 min depois do corte, mais que os 90 de bloqueio.
  assert.equal(
    avaliar({ agora: em('2026-09-08T20:35:00Z'), config }).fase,
    'livre',
  );
});

test('licenca valida troca fechado por liberado', () => {
  const agora = em('2026-09-08T19:05:00Z');
  const situacao = avaliar({
    agora,
    config,
    liberadoAte: agora.getTime() + 10 * 60 * 1000,
  });
  assert.equal(situacao.fase, 'liberado');
});

test('licenca vencida nao segura o bloqueio', () => {
  const agora = em('2026-09-08T19:05:00Z');
  const situacao = avaliar({
    agora,
    config,
    liberadoAte: agora.getTime() - 1000,
  });
  assert.equal(situacao.fase, 'fechado');
});

test('o corte das 22h fecha e atravessa a meia-noite', () => {
  // 23:20 em São Paulo (02:20Z do dia seguinte): 80 min depois do corte.
  const situacao = avaliar({ agora: em('2026-09-09T02:20:00Z'), config });
  assert.equal(situacao.fase, 'fechado');
  assert.equal(situacao.corte, '22:00');
  assert.equal(situacao.minutos, 80);
});

test('JANELA_OFF deixa tudo livre', () => {
  const situacao = avaliar({
    agora: em('2026-09-08T19:05:00Z'),
    config: { ...config, desligada: true },
  });
  assert.equal(situacao.fase, 'livre');
});

test('a licenca nunca passa do proximo corte', () => {
  // 15:50 em São Paulo pedindo 45 min: só pode ir até as 16:00.
  const agora = em('2026-09-08T18:50:00Z');
  const ate = limitarLicenca({ agora, config, minutosPedidos: 45 });
  assert.equal(ate - agora.getTime(), 10 * 60 * 1000);
});

test('a licenca inteira vale quando cabe antes do corte', () => {
  const agora = em('2026-09-08T13:00:00Z');
  const ate = limitarLicenca({ agora, config, minutosPedidos: 45 });
  assert.equal(ate - agora.getTime(), 45 * 60 * 1000);
});

test('paraHhmm formata com dois digitos', () => {
  assert.equal(paraHhmm(9 * 60 + 5), '09:05');
  assert.equal(paraHhmm(0), '00:00');
});
