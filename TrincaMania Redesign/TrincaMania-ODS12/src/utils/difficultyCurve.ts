/**
 * Curva de progresso em dois estágios, usada para dar uma sensação de
 * dificuldade que "explode" perto do fim de um mapa em vez de subir reto.
 *
 * Um mapa é dividido em blocos de `blockSize` fases (o mesmo tamanho dos
 * marcos de ritmo — descanso/loja — que o jogo já usa). Dentro de um bloco,
 * a posição relativa passa por `localFrac ** gamma`: com `gamma > 1` a fase
 * fica "parada" perto do início do bloco e acelera perto do fim dele. Entre
 * blocos, o peso de cada bloco cresce geometricamente por `blockGrowth`, o
 * que faz o bloco seguinte pesar mais no total do que o anterior pesou sobre
 * o anterior a ele — dois blocos idênticos em tamanho, mas o de trás sente
 * mais apertado.
 *
 * Em `gamma = 1` e `blockGrowth = 1` isto se reduz exatamente ao progresso
 * linear de sempre (`(posição - 1) / (total - 1)`) — é uma generalização,
 * não uma substituição. E o resultado é estritamente monotônico em
 * `position` para `gamma > 0`, então qualquer fórmula que já garantia "nunca
 * regride" com progresso linear continua garantindo com a curva.
 */
export type DifficultyCurve = {
  /** Expoente dentro do bloco. 1 = linear. Maior que 1 = achata o início do bloco e acelera o fim. */
  gamma: number;
  /** Fator de crescimento do peso de um bloco para o próximo. 1 = todos os blocos pesam igual. */
  blockGrowth: number;
};

/** Curva neutra: reproduz o progresso linear de sempre. Útil como valor-base/fallback. */
export const LINEAR_DIFFICULTY_CURVE: DifficultyCurve = {
  gamma: 1,
  blockGrowth: 1,
};

/**
 * Progresso curvado no intervalo [0, 1] para a `position` (1-indexada) de
 * `total` fases, com blocos de `blockSize` fases.
 */
export const curveProgress = (
  position: number,
  total: number,
  blockSize: number,
  curve: DifficultyCurve,
): number => {
  if (total <= 1) {
    return 0;
  }

  const safeBlockSize = Math.max(1, Math.min(blockSize, total));
  const blockCount = Math.ceil(total / safeBlockSize);
  const blockIndex = Math.floor((position - 1) / safeBlockSize);
  const withinBlock = (position - 1) % safeBlockSize;
  // O último bloco pode ser mais curto quando blockSize não divide total.
  const blockSpan = Math.min(safeBlockSize, total - blockIndex * safeBlockSize);
  const localFrac = blockSpan > 1 ? withinBlock / (blockSpan - 1) : 0;
  const localCurved = localFrac ** curve.gamma;

  let cumulativeBefore = 0;
  let totalWeight = 0;
  for (let index = 0; index < blockCount; index += 1) {
    const weight = curve.blockGrowth ** index;
    totalWeight += weight;
    if (index < blockIndex) {
      cumulativeBefore += weight;
    }
  }
  const thisBlockWeight = curve.blockGrowth ** blockIndex;

  return (cumulativeBefore + localCurved * thisBlockWeight) / totalWeight;
};
