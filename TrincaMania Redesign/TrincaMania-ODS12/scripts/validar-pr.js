const { avaliar, main } = require('../../../.github/scripts/validar-pr');

const monitorar = async ({
  consultar,
  sha,
  watch = false,
  agora = Date.now,
  esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  informar = console.log,
  prazoMs = 30 * 60 * 1000,
}) => {
  const limite = agora() + prazoMs;
  for (;;) {
    const { pr, runs } = await consultar();
    const resultado = avaliar(pr, runs, sha);
    informar(`[${resultado.estado}] ${resultado.motivo}`);
    if (resultado.estado === 'sucesso') return 0;
    if (resultado.estado === 'falha') return 1;
    if (!watch || agora() >= limite) return 2;
    await esperar(15000);
  }
};

module.exports = { avaliar, monitorar };
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
