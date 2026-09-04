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
 * Dentro de cada bloco, a posição ocupa uma fatia
 * `[withinBlock/blockSpan, (withinBlock+1)/blockSpan)` — não `[0, 1]`
 * fechado —, então a última posição de um bloco fica sempre estritamente
 * abaixo do valor bruto acumulado do bloco, que é onde a primeira posição do
 * bloco seguinte começa. Isso evita que os dois empatem (uma versão anterior
 * usava `blockSpan - 1` como base, fechava em 1 exatamente na última posição
 * de cada bloco e colidia com o começo do próximo — dois níveis adjacentes
 * saíam com a mesma dificuldade em toda fronteira de bloco).
 *
 * Só que esse valor bruto, sozinho, também não fecha em 1 na ÚLTIMA posição
 * de todas (`position = total`) — mesmo motivo, um bloco a menos. Como o
 * restante do código (tempo de estrela, contagem de mistério, faixa de
 * peças) foi calibrado assumindo que a fase/mapa final de cada mundo/
 * capítulo bate o teto exato, a função normaliza o bruto pelo seu próprio
 * valor em `position = total`: `curveProgress(total, total, blockSize,
 * curve)` vale exatamente 1 por construção (dividido por si mesmo), e todo
 * o resto da curva escala junto — preserva a ordem estrita (dividir por uma
 * constante positiva não inverte comparação) e ainda cobre os dois extremos
 * exatos: `position = 1` sempre 0, `position = total` sempre 1.
 * `tests/difficultyCurve.test.cjs` trava as duas garantias (monotonicidade
 * estrita e os extremos exatos).
 */
export type DifficultyCurve = {
  /** Expoente dentro do bloco. 1 = linear. Maior que 1 = achata o início do bloco e acelera o fim. */
  gamma: number;
  /** Fator de crescimento do peso de um bloco para o próximo. 1 = todos os blocos pesam igual. */
  blockGrowth: number;
};

/** Curva neutra: aproxima o progresso linear de sempre (ver ressalva acima). Útil como valor-base/fallback. */
export const LINEAR_DIFFICULTY_CURVE: DifficultyCurve = {
  gamma: 1,
  blockGrowth: 1,
};

/**
 * Valor bruto (não normalizado no topo — ver `curveProgress`) da mesma
 * curva. Isolado só para a normalização em `curveProgress` poder chamar de
 * novo com `position = total` sem duplicar a lógica.
 */
const rawCurveProgress = (
  position: number,
  total: number,
  blockSize: number,
  curve: DifficultyCurve,
): number => {
  const safeBlockSize = Math.max(1, Math.min(blockSize, total));
  const blockCount = Math.ceil(total / safeBlockSize);
  const blockIndex = Math.floor((position - 1) / safeBlockSize);
  const withinBlock = (position - 1) % safeBlockSize;
  // O último bloco pode ser mais curto quando blockSize não divide total.
  const blockSpan = Math.min(safeBlockSize, total - blockIndex * safeBlockSize);
  const localFrac = withinBlock / blockSpan;
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

/**
 * Progresso curvado no intervalo [0, 1] para a `position` (1-indexada) de
 * `total` fases, com blocos de `blockSize` fases. `position = 1` vale
 * exatamente 0, `position = total` vale exatamente 1, estritamente
 * crescente entre os dois — inclusive nas fronteiras de bloco.
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

  const raw = rawCurveProgress(position, total, blockSize, curve);
  const rawMax = rawCurveProgress(total, total, blockSize, curve);

  return rawMax > 0 ? raw / rawMax : raw;
};

/**
 * Folga somada antes do `Math.floor` em `bandIndex`.
 *
 * Um score de fronteira quase nunca é exato em binário. `(4 - 1) / 9 * 0.6`,
 * por exemplo, não dá `0.2`: dá `0.19999999999999998`, e multiplicado por 5
 * vira `0.9999999999999999` em vez de `1`. Sem a folga o `floor` derruba uma
 * faixa inteira — foi exatamente o que acontecia com o primeiro mapa dos
 * capítulos 4 e 7.
 *
 * 1e-9 é ordens de grandeza maior que o erro acumulado de um `double` nessas
 * contas e ordens de grandeza menor que a largura de uma faixa (0,2 com cinco
 * faixas), então não existe score legítimo que ela desloque.
 */
const BORDA_DE_FAIXA = 1e-9;

/**
 * Em qual das `bandCount` faixas iguais de `[0, 1]` cai `score`, tolerando o
 * erro de ponto flutuante na fronteira. Devolve um índice em
 * `[0, bandCount - 1]`, pronto para indexar um array de faixas.
 *
 * Existe para que a correção da fronteira more num lugar só: toda derivação
 * de faixa a partir de um progresso curvado (campanha e capítulos) passa por
 * aqui em vez de repetir o `floor` com a folga na mão.
 */
export const bandIndex = (score: number, bandCount: number): number =>
  Math.max(
    0,
    Math.min(bandCount - 1, Math.floor(score * bandCount + BORDA_DE_FAIXA)),
  );
