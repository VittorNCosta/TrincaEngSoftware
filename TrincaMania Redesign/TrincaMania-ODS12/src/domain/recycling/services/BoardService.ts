import { Tile } from '../../../types/game';

export const TILE_SIZE = 52;
export const BOARD_WIDTH = 320;
export const BOARD_HEIGHT = 360;

export type TileRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const isTileRemoved = (tile: Tile) => tile.removed === true;

export const getTileRect = (tile: Tile): TileRect => ({
  bottom: tile.y + TILE_SIZE,
  left: tile.x,
  right: tile.x + TILE_SIZE,
  top: tile.y,
});

export const rectanglesOverlap = (firstRect: TileRect, secondRect: TileRect) =>
  firstRect.left < secondRect.right &&
  firstRect.right > secondRect.left &&
  firstRect.top < secondRect.bottom &&
  firstRect.bottom > secondRect.top;

// Uma peça está "por cima" de outra se tem z maior OU, no mesmo z, é desenhada
// depois (índice maior no array). O GameBoard desenha ordenando por z e mantém a
// ordem do array para z igual — então o índice maior é a peça que aparece na
// frente. Amarrar o bloqueio a essa mesma ordem garante que toda peça
// visualmente por baixo de outra que a sobrepõe fique bloqueada.
export const isDrawnAbove = (
  otherTile: Tile,
  otherIndex: number,
  tile: Tile,
  tileIndex: number,
) => otherTile.z > tile.z || (otherTile.z === tile.z && otherIndex > tileIndex);

export const isTileBlocked = (tile: Tile, board: Tile[]) => {
  if (isTileRemoved(tile)) {
    return false;
  }

  const tileRect = getTileRect(tile);
  const tileIndex = board.findIndex((boardTile) => boardTile.id === tile.id);

  return board.some(
    (otherTile, otherIndex) =>
      otherTile.id !== tile.id &&
      !isTileRemoved(otherTile) &&
      isDrawnAbove(otherTile, otherIndex, tile, tileIndex) &&
      rectanglesOverlap(tileRect, getTileRect(otherTile)),
  );
};

export const countRemainingTiles = (board: Tile[]) =>
  board.filter((tile) => !isTileRemoved(tile)).length;

export const isMysteryTileHidden = (tile: Tile) =>
  tile.mystery === true && tile.revealed !== true;

export const revealAvailableMysteryTiles = (board: Tile[]) => {
  let revealedAnyTile = false;
  const revealedBoard = board.map((tile) => {
    if (isTileRemoved(tile) || !isMysteryTileHidden(tile) || isTileBlocked(tile, board)) {
      return tile;
    }

    revealedAnyTile = true;

    return {
      ...tile,
      revealed: true,
    };
  });

  return revealedAnyTile ? revealedBoard : board;
};

export const getAvailableTiles = (board: Tile[]) =>
  board.filter((tile) => !isTileRemoved(tile) && !isTileBlocked(tile, board));

/** Peças que o jogador consegue clicar agora (disponíveis e já reveladas). */
export const getPlayableTiles = (board: Tile[]) =>
  getAvailableTiles(board).filter((tile) => !isMysteryTileHidden(tile));
