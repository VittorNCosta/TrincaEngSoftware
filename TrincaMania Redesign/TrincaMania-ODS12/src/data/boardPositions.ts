/**
 * Posições de peça no tabuleiro.
 *
 * ## O bug que este módulo corrige
 *
 * A lista autoral tinha exatamente 60 posições e `makeTiles` fazia
 * `const [x, y, z] = LEVEL_POSITIONS[index]`. Qualquer fase com `tileCount`
 * maior que 60 lia `undefined` e estourava um TypeError já no import de
 * `src/data/levels.ts` — ou seja, o app inteiro deixava de subir. Enquanto
 * nenhuma fase passava de 60 peças o defeito ficou latente; os capítulos novos
 * chegam a 102 peças e o exporiam de imediato.
 *
 * ## Como fica corrigido
 *
 * As 60 posições autorais continuam **exatamente** as mesmas, na mesma ordem —
 * elas definem o enquadramento das 203 fases canônicas e há teste travando os
 * bounds da Fase 61. A partir do índice 60 as posições passam a ser geradas
 * sobre a mesma retícula 8x7 usada pelas autorais (x = 6 + 34c, y = 44 + 34r),
 * subindo de camada em camada e pulando qualquer célula já ocupada por uma
 * posição autoral. Nada é sobrescrito; o tabuleiro só cresce.
 *
 * `getTilePosition` nunca retorna `undefined`: acima do estoque disponível ele
 * faz clamp explícito na última posição, que é degradação visível (peças
 * empilhadas) em vez de crash.
 */

export type TilePosition = [number, number, number];

/** Passo da retícula. Metade da peça (52) mais folga, como no layout autoral. */
const GRID_STEP = 34;
const GRID_ORIGIN_X = 6;
const GRID_ORIGIN_Y = 44;
const GRID_COLUMNS = 8;
const GRID_ROWS = 7;
/** Camadas geradas acima das autorais. 12 x 56 células = teto de 672 posições. */
const GENERATED_LAYERS = 12;

/**
 * Layout autoral das 203 fases canônicas. **Não reordenar nem editar**: os
 * bounds do tabuleiro de fases existentes derivam desta ordem exata.
 */
export const AUTHORED_TILE_POSITIONS: readonly TilePosition[] = [
  [40, 44, 0],
  [108, 44, 0],
  [176, 44, 0],
  [40, 112, 0],
  [108, 112, 0],
  [176, 112, 0],
  [40, 180, 0],
  [108, 180, 0],
  [176, 180, 0],
  [74, 248, 0],
  [142, 248, 0],
  [210, 248, 0],
  [74, 78, 1],
  [142, 146, 1],
  [108, 214, 1],
  [176, 214, 1],
  [210, 112, 1],
  [6, 146, 1],
  [74, 146, 2],
  [142, 78, 2],
  [176, 180, 2],
  [6, 214, 0],
  [244, 180, 0],
  [210, 248, 1],
  [40, 78, 2],
  [210, 146, 2],
  [108, 248, 2],
  [6, 78, 1],
  [244, 78, 1],
  [142, 214, 3],
  [74, 112, 3],
  [176, 112, 3],
  [108, 180, 3],
  [210, 214, 2],
  [40, 248, 2],
  [244, 248, 1],
  [6, 248, 2],
  [244, 112, 2],
  [74, 214, 3],
  [176, 78, 3],
  [142, 180, 3],
  [244, 214, 3],
  [108, 112, 4],
  [176, 146, 4],
  [40, 180, 4],
  [210, 180, 4],
  [74, 248, 4],
  [142, 248, 4],
  [108, 44, 4],
  [176, 44, 4],
  [40, 112, 4],
  [210, 112, 4],
  [74, 180, 4],
  [142, 146, 4],
  [108, 214, 5],
  [176, 214, 5],
  [74, 78, 5],
  [210, 78, 5],
  [142, 112, 5],
  [108, 180, 5],
];

const positionKey = ([x, y, z]: TilePosition) => `${x}:${y}:${z}`;

/**
 * Ordem de preenchimento dentro de uma camada: do centro para fora.
 *
 * Um mahjong-solitaire lido do centro é mais legível — o jogador entende a
 * pilha como uma massa que se abre, não como uma grade preenchida linha a
 * linha. A ordenação é totalmente determinística (desempate por linha e
 * coluna), então o mesmo índice devolve sempre a mesma célula.
 */
const buildLayerCells = (): { column: number; row: number }[] => {
  const centerColumn = (GRID_COLUMNS - 1) / 2;
  const centerRow = (GRID_ROWS - 1) / 2;
  const cells: { column: number; row: number }[] = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      cells.push({ column, row });
    }
  }

  return cells.sort((first, second) => {
    const firstDistance =
      Math.abs(first.column - centerColumn) + Math.abs(first.row - centerRow);
    const secondDistance =
      Math.abs(second.column - centerColumn) + Math.abs(second.row - centerRow);

    return (
      firstDistance - secondDistance ||
      first.row - second.row ||
      first.column - second.column
    );
  });
};

const buildTilePositions = (): TilePosition[] => {
  const positions: TilePosition[] = AUTHORED_TILE_POSITIONS.map(
    (position): TilePosition => [...position],
  );
  const usedKeys = new Set(positions.map(positionKey));
  const layerCells = buildLayerCells();
  const maxAuthoredLayer = AUTHORED_TILE_POSITIONS.reduce(
    (highest, [, , z]) => Math.max(highest, z),
    0,
  );

  for (
    let layer = 0;
    layer <= maxAuthoredLayer + GENERATED_LAYERS;
    layer += 1
  ) {
    layerCells.forEach(({ column, row }) => {
      const position: TilePosition = [
        GRID_ORIGIN_X + column * GRID_STEP,
        GRID_ORIGIN_Y + row * GRID_STEP,
        layer,
      ];
      const key = positionKey(position);

      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        positions.push(position);
      }
    });
  }

  return positions;
};

const TILE_POSITIONS: readonly TilePosition[] = buildTilePositions();

/** Quantas peças distintas o tabuleiro comporta sem repetir posição. */
export const MAX_TILE_POSITIONS = TILE_POSITIONS.length;

/**
 * Posição da n-ésima peça. Índice fora do estoque faz clamp na última posição
 * conhecida — nunca `undefined`, nunca TypeError.
 */
export const getTilePosition = (index: number): TilePosition => {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;

  return TILE_POSITIONS[Math.min(safeIndex, TILE_POSITIONS.length - 1)];
};

/** Recorte contíguo das primeiras `count` posições, já com clamp aplicado. */
export const takeTilePositions = (count: number): TilePosition[] => {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

  return Array.from(
    { length: Math.min(safeCount, TILE_POSITIONS.length) },
    (_, index) => getTilePosition(index),
  );
};
